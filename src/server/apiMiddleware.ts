import type { IncomingMessage, ServerResponse } from 'http';
import {
  handleGeminiStream,
  getGeminiClient,
  getGeminiRequestTimeoutMs,
  type ChatRequestOptions,
} from './geminiService';

const SSE_KEEPALIVE_MS = 10_000;

export function createApiMiddleware() {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = req.url || '';

    if (url === '/api/health' && req.method === 'GET') {
      const hasKey = !!process.env.GEMINI_API_KEY;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: hasKey ? 'configured' : 'missing_key',
          hasKey,
          defaultModel: 'gemini-3.7-flash',
          geminiRequestTimeoutMs: getGeminiRequestTimeoutMs(),
          supportedModels: [
            { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash', desc: 'Hybrid reasoning and speed', badge: 'Recommended' },
            { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', desc: 'Ultra-low latency lightweight tasks', badge: 'Fast' },
          ],
        })
      );
      return;
    }

    if (url === '/api/chat' && req.method === 'POST') {
      let body = '';

      req.on('data', (chunk) => {
        body += chunk;
      });

      req.on('end', async () => {
        let keepAliveTimer: NodeJS.Timeout | undefined;
        let watchdogTimer: NodeJS.Timeout | undefined;
        const controller = new AbortController();

        const abortOnDisconnect = () => {
          if (!res.writableEnded && !controller.signal.aborted) {
            controller.abort(new Error('Client disconnected.'));
          }
        };

        req.once('aborted', abortOnDisconnect);
        res.once('close', abortOnDisconnect);

        try {
          const payload: ChatRequestOptions = JSON.parse(body || '{}');

          if (!payload.messages || !Array.isArray(payload.messages) || payload.messages.length === 0) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'INVALID_REQUEST', message: 'A valid messages array is required.' }));
            return;
          }

          if (!getGeminiClient()) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                error: 'MISSING_API_KEY',
                message: 'GEMINI_API_KEY is not set in environment secrets. Configure it in Settings > Secrets.',
              })
            );
            return;
          }

          res.writeHead(200, {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
          });
          res.flushHeaders();
          res.write(': connected\n\n');

          keepAliveTimer = setInterval(() => {
            if (!res.writableEnded && !res.destroyed) {
              res.write(': keep-alive\n\n');
            }
          }, SSE_KEEPALIVE_MS);

          watchdogTimer = setTimeout(() => {
            if (!controller.signal.aborted) {
              controller.abort(
                new Error(`Gemini request exceeded ${getGeminiRequestTimeoutMs()} ms timeout.`)
              );
            }
          }, getGeminiRequestTimeoutMs());

          await handleGeminiStream(
            payload,
            (chunk) => {
              if (!res.writableEnded && !res.destroyed) {
                res.write(`data: ${JSON.stringify(chunk)}\n\n`);
              }
            },
            controller.signal
          );

          if (!res.writableEnded && !res.destroyed) {
            res.write('data: [DONE]\n\n');
            res.end();
          }
        } catch (err: unknown) {
          const error = err as Error;
          const reason = controller.signal.reason;
          const reasonMessage = reason instanceof Error ? reason.message : undefined;
          const message = reasonMessage || error?.message || 'An unexpected error occurred.';

          if (message !== 'Client disconnected.') {
            console.error('Error handling Gemini stream:', error);
          }

          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'SERVER_ERROR', message }));
          } else if (!res.writableEnded && !res.destroyed) {
            res.write(
              `data: ${JSON.stringify({
                text: `\n\nGeneration failed: ${message}`,
              })}\n\n`
            );
            res.write('data: [DONE]\n\n');
            res.end();
          }
        } finally {
          if (keepAliveTimer) clearInterval(keepAliveTimer);
          if (watchdogTimer) clearTimeout(watchdogTimer);
          req.off('aborted', abortOnDisconnect);
          res.off('close', abortOnDisconnect);
        }
      });
      return;
    }

    next();
  };
}
