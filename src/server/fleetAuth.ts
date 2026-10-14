import { createHash, timingSafeEqual } from 'node:crypto';

export type FleetAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 503; code: 'UNAUTHORIZED' | 'SERVICE_TOKEN_NOT_CONFIGURED' };

// The Fleet model endpoint is an internal service, never a public browser API.
// Keep authentication at the provider boundary; a dashboard must use its own BFF.
export function authorizeFleetRequest(
  authorization: string | undefined,
  configuredToken: string | undefined,
): FleetAuthResult {
  if (!configuredToken || configuredToken.length < 32) {
    return { ok: false, status: 503, code: 'SERVICE_TOKEN_NOT_CONFIGURED' };
  }
  const match = /^Bearer ([^\s]+)$/.exec(authorization || '');
  if (!match) return { ok: false, status: 401, code: 'UNAUTHORIZED' };
  const expected = createHash('sha256').update(configuredToken).digest();
  const received = createHash('sha256').update(match[1]).digest();
  if (!timingSafeEqual(expected, received)) {
    return { ok: false, status: 401, code: 'UNAUTHORIZED' };
  }
  return { ok: true };
}
