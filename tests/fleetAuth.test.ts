import assert from 'node:assert/strict';
import test from 'node:test';
import {
  authorizeFleetRequest, operatorAuthConfigured, verifyOperatorPassword,
  sameOrigin, issueOperatorCookie, verifyOperatorCookie, clearOperatorCookie,
} from '../src/server/fleetAuth';

const token = 'test-only-service-token-with-at-least-32-bytes';
test('Fleet auth fails closed when no configured secret exists', () => {
  assert.deepEqual(authorizeFleetRequest(undefined, undefined), {
    ok: false, status: 503, code: 'SERVICE_TOKEN_NOT_CONFIGURED',
  });
  assert.equal(authorizeFleetRequest('Bearer x', 'short').ok, false);
});
test('Fleet auth rejects missing, malformed and incorrect credentials', () => {
  for (const header of [undefined, '', 'Basic abc', 'Bearer wrong', `Bearer ${token} extra`]) {
    assert.deepEqual(authorizeFleetRequest(header, token), { ok: false, status: 401, code: 'UNAUTHORIZED' });
  }
});
test('Fleet auth accepts only the exact service bearer token', () => {
  assert.deepEqual(authorizeFleetRequest(`Bearer ${token}`, token), { ok: true });
});

test('Operator access requires two separate server-side secrets', () => {
  assert.equal(operatorAuthConfigured(token, 'another-long-operator-password'), true);
  assert.equal(operatorAuthConfigured(token, undefined), false);
  assert.equal(operatorAuthConfigured('short', 'another-long-operator-password'), false);
  assert.equal(verifyOperatorPassword('correct-operator-secret', 'correct-operator-secret'), true);
  assert.equal(verifyOperatorPassword('wrong-operator-secret', 'correct-operator-secret'), false);
});
test('Browser session requires correct signature, same origin and unexpired cookie', () => {
  const now = 1000000000000;
  const session = issueOperatorCookie(token, true, now);
  const cookie = session.split(';')[0];
  assert.match(session, /HttpOnly/);
  assert.match(session, /SameSite=Strict/);
  assert.match(session, /Secure/);
  assert.equal(verifyOperatorCookie(cookie, token, now + 1000), true);
  assert.equal(verifyOperatorCookie(cookie, 'different-super-secret-service-token-value', now + 1000), false);
  assert.equal(verifyOperatorCookie(cookie, token, now + 8 * 60 * 60 * 1000), false);
  assert.equal(verifyOperatorCookie(cookie.replace(/.$/, '0'), token, now + 1000), false);
  assert.match(clearOperatorCookie(true), /Max-Age=0/);
  assert.equal(sameOrigin('https://fleet.example', 'fleet.example'), true);
  assert.equal(sameOrigin('https://evil.example', 'fleet.example'), false);
  assert.equal(sameOrigin(undefined, 'fleet.example'), false);
});
