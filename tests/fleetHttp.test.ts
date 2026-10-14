import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import test from 'node:test';
import { createApiMiddleware } from '../src/server/apiMiddleware';

const TOKEN = 'safe-fixture-fleet-service-token-32-characters';
const PASSWORD = 'long-test-only-operator-password';

test('Fleet HTTP denies anonymous chat and supports HttpOnly operator session', async () => {
  const original = {
    service: process.env.OSA_FLEET_SERVICE_TOKEN,
    password: process.env.OSA_FLEET_OPERATOR_PASSWORD,
    model: process.env.GEMINI_API_KEY,
  };
  process.env.OSA_FLEET_SERVICE_TOKEN = TOKEN;
  process.env.OSA_FLEET_OPERATOR_PASSWORD = PASSWORD;
  delete process.env.GEMINI_API_KEY; // Stops before any external model call.

  const middleware = createApiMiddleware();
  const server = createServer((req, res) => {
    void middleware(req, res, () => { res.writeHead(404); res.end(); });
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as AddressInfo).port;
  const origin = `http://127.0.0.1:${port}`;
  const payload = JSON.stringify({ messages: [{ role: 'user', text: 'test' }] });
  const post = (headers: Record<string, string>) => fetch(`${origin}/api/chat`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: payload,
  });

  try {
    const anon = await post({ Origin: origin });
    assert.equal(anon.status, 401);
    const crossSite = await fetch(`${origin}/api/session`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example' },
      body: JSON.stringify({ password: PASSWORD }),
    });
    assert.equal(crossSite.status, 403);

    const invalid = await fetch(`${origin}/api/session`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin },
      body: JSON.stringify({ password: 'wrong' }),
    });
    assert.equal(invalid.status, 401);

    const login = await fetch(`${origin}/api/session`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin },
      body: JSON.stringify({ password: PASSWORD }),
    });
    assert.equal(login.status, 200);
    const cookie = login.headers.get('set-cookie')?.split(';')[0];
    assert.ok(cookie);

    const session = await post({ Origin: origin, Cookie: cookie });
    assert.equal(session.status, 400); // MISSING_API_KEY: auth passed, model deliberately disabled.
    assert.equal((await session.json()).error, 'MISSING_API_KEY');

    const attack = await post({ Origin: 'https://evil.example', Cookie: cookie });
    assert.equal(attack.status, 401);

    const service = await post({ Authorization: `Bearer ${TOKEN}` });
    assert.equal(service.status, 400);
    assert.equal((await service.json()).error, 'MISSING_API_KEY');

    const logout = await fetch(`${origin}/api/session`, { method: 'DELETE', headers: { Origin: origin } });
    assert.equal(logout.status, 200);
    assert.match(logout.headers.get('set-cookie') || '', /Max-Age=0/);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    if (original.service === undefined) delete process.env.OSA_FLEET_SERVICE_TOKEN;
    else process.env.OSA_FLEET_SERVICE_TOKEN = original.service;
    if (original.password === undefined) delete process.env.OSA_FLEET_OPERATOR_PASSWORD;
    else process.env.OSA_FLEET_OPERATOR_PASSWORD = original.password;
    if (original.model === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = original.model;
  }
});
