import assert from 'node:assert/strict';
import test from 'node:test';
import { authorizeFleetRequest } from '../src/server/fleetAuth';

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
