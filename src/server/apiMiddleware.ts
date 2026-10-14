import type { IncomingMessage, ServerResponse } from 'http';
import {
  authorizeFleetRequest, operatorAuthConfigured, verifyOperatorPassword,
  sameOrigin, issueOperatorCookie, clearOperatorCookie, verifyOperatorCookie,
} from './fleetAuth';
import {
  handleGeminiStream,
  getGeminiClient,
  getGeminiRequestTimeoutMs,
  type ChatRequestOptions,
} from './geminiService';

const SSE_KEEPALIVE_MS = 10_000;
const loginAttempts = new Map<string, { count: number; since: number }>();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
function rateLimit(ip: string): boolean {
  const now = Date.now();
  const previous = loginAttempts.get(ip);
  if (!previous || now - previous.since > LOGIN_WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, since: now });
    return true;
  }
  if (previous.count >= 10) return false;
  previous.count++;
  return true;
}


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


    if (url === '/api/session') {
      const serviceToken = process.env.OSA_FLEET_SERVICE_TOKEN;
      const password = process.env.OSA_FLEET_OPERATOR_PASSWORD;
      const configured = operatorAuthConfigured(serviceToken, password);
      const secure = process.env.NODE_ENV === 'production';
      const reply = (status: number, body: Record<string, unknown>, cookie?: string) => {
        res.writeHead(status, {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          ...(cookie ? { 'Set-Cookie': cookie } : {}),
        });
        res.end(JSON.stringify(body));
      };
      if (req.method === 'GET') {
        reply(200, { configured, authenticated: configured && verifyOperatorCookie(req.headers.cookie, serviceToken) });
        return;
      }
      if (req.method === 'DELETE') {
        if (!sameOrigin(req.headers.origin, req.headers.host)) { reply(403, { error: 'ORIGIN_DENIED' }); return; }
        reply(200, { authenticated: false }, clearOperatorCookie(secure));
        return;
      }
      if (req.method === 'POST') {
        if (!sameOrigin(req.headers.origin, req.headers.host)) { reply(403, { error: 'ORIGIN_DENIED' }); return; }
        if (!configured) { reply(503, { error: 'OPERATOR_AUTH_NOT_CONFIGURED' }); return; }
        const ip = req.socket.remoteAddress || 'unknown';
        if (!rateLimit(ip)) { reply(429, { error: 'TOO_MANY_ATTEMPTS' }); return; }
        let body = '';
        let oversized = false;
        req.on('data', chunk => {
          body += chunk;
          if (!oversized && body.length > 4096) { oversized = true; body = ''; reply(413, { error: 'BODY_TOO_LARGE' }); }
        });
        req.on('end', () => {
          if (oversized || res.writableEnded) return;
          let value: unknown;
          try { value = JSON.parse(body); } catch { reply(400, { error: 'INVALID_JSON' }); return; }
          const supplied = value && typeof value === 'object' && !Array.isArray(value)
            ? (value as Record<string, unknown>).password : undefined;
          if (typeof supplied !== 'string' || !verifyOperatorPassword(supplied, password)) {
            reply(401, { error: 'UNAUTHORIZED' });
            return;
          }
          loginAttempts.delete(ip);
          reply(200, { authenticated: true }, issueOperatorCookie(serviceToken!, secure));
        });
        return;
      }
      reply(405, { error: 'METHOD_NOT_ALLOWED' });
      return;
    }

    if (url === '/api/chat' && req.method === 'POST') {
      const auth = authorizeFleetRequest(req.headers.authorization, process.env.OSA_FLEET_SERVICE_TOKEN);
      const operatorSession = sameOrigin(req.headers.origin, req.headers.host) &&
        operatorAuthConfigured(process.env.OSA_FLEET_SERVICE_TOKEN, process.env.OSA_FLEET_OPERATOR_PASSWORD) &&
        verifyOperatorCookie(req.headers.cookie, process.env.OSA_FLEET_SERVICE_TOKEN);
      if (auth.ok === false && !operatorSession) {
        res.writeHead(auth.status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify({ error: auth.code }));
        return;
      }
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
            res.write('data: {"type":"done"}\n\n');
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
            res.end(JSON.stringify({ error: 'SERVER_ERROR', message: 'Model generation failed.' }));
          } else if (!res.writableEnded && !res.destroyed) {
            // Never encode upstream failure as normal chat text.
            res.write(`data: ${JSON.stringify({ type: 'error', error: { code: 'GENERATION_FAILED', message: 'Model generation failed.' } })}\n\n`);
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
