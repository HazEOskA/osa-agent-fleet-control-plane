import type { IncomingMessage, ServerResponse } from 'http';
import { handleGeminiStream, getGeminiClient, type ChatRequestOptions } from './geminiService';

export function createApiMiddleware() {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = req.url || '';

    // Route: GET /api/health
    if (url === '/api/health' && req.method === 'GET') {
      const hasKey = !!process.env.GEMINI_API_KEY;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'ok',
          hasKey,
          defaultModel: 'gemini-3.7-flash',
          supportedModels: [
            { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash', desc: 'Hybrid reasoning and speed', badge: 'Recommended' },
            { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', desc: 'Ultra-low latency lightweight tasks', badge: 'Fast' },
          ],
        })
      );
      return;
    }

    // Route: POST /api/chat
    if (url === '/api/chat' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });

      req.on('end', async () => {
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

          // Setup SSE stream
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
          });

          // Send keep-alive ping
          res.write(': ping\n\n');

          await handleGeminiStream(payload, (chunk) => {
            const dataStr = JSON.stringify(chunk);
            res.write(`data: ${dataStr}\n\n`);
          });

          res.write('data: [DONE]\n\n');
          res.end();
        } catch (err: unknown) {
          const error = err as Error;
          console.error('Error handling Gemini stream:', error);
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'SERVER_ERROR', message: error?.message || 'An unexpected error occurred.' }));
          } else {
            res.write(`data: ${JSON.stringify({ error: error?.message || 'Stream failed' })}\n\n`);
            res.write('data: [DONE]\n\n');
            res.end();
          }
        }
      });
      return;
    }

    next();
  };
}
