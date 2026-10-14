import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const COOKIE_NAME = 'osa_fleet_session';

export type FleetAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 503; code: 'UNAUTHORIZED' | 'SERVICE_TOKEN_NOT_CONFIGURED' };

function equal(left: string, right: string): boolean {
  const a = createHash('sha256').update(left).digest();
  const b = createHash('sha256').update(right).digest();
  return timingSafeEqual(a, b);
}

// Internal agent-to-agent calls use an explicit server-side bearer credential.
export function authorizeFleetRequest(
  authorization: string | undefined,
  configuredToken: string | undefined,
): FleetAuthResult {
  if (!configuredToken || configuredToken.length < 32) {
    return { ok: false, status: 503, code: 'SERVICE_TOKEN_NOT_CONFIGURED' };
  }
  const match = /^Bearer ([^\s]+)$/.exec(authorization || '');
  if (!match || !equal(match[1], configuredToken)) {
    return { ok: false, status: 401, code: 'UNAUTHORIZED' };
  }
  return { ok: true };
}

export function operatorAuthConfigured(
  serviceToken: string | undefined,
  operatorPassword: string | undefined,
): boolean {
  return !!serviceToken && serviceToken.length >= 32 && !!operatorPassword && operatorPassword.length >= 16;
}

export function verifyOperatorPassword(submitted: string, configured: string | undefined): boolean {
  return !!configured && configured.length >= 16 && equal(submitted, configured);
}

export function sameOrigin(origin: string | undefined, host: string | undefined): boolean {
  if (!origin || !host) return false;
  try {
    const url = new URL(origin);
    return (url.protocol === 'https:' || url.protocol === 'http:') &&
      url.origin === `${url.protocol}//${host}`;
  } catch { return false; }
}

function signature(payload: string, serviceToken: string): string {
  return createHmac('sha256', serviceToken).update(payload).digest('hex');
}

export function issueOperatorCookie(serviceToken: string, secure: boolean, now = Date.now()): string {
  const payload = `${now + SESSION_TTL_MS}.${randomBytes(16).toString('hex')}`;
  const session = `${payload}.${signature(payload, serviceToken)}`;
  return `${COOKIE_NAME}=${session}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800${secure ? '; Secure' : ''}`;
}

export function clearOperatorCookie(secure: boolean): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure ? '; Secure' : ''}`;
}

export function verifyOperatorCookie(
  cookieHeader: string | undefined, serviceToken: string | undefined, now = Date.now()
): boolean {
  if (!serviceToken || serviceToken.length < 32) return false;
  const session = (cookieHeader || '').split(';').map(v => v.trim())
    .find(v => v.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1);
  if (!session) return false;
  const match = /^(\d{13})\.([0-9a-f]{32})\.([0-9a-f]{64})$/.exec(session);
  if (!match) return false;
  const expiration = Number(match[1]);
  if (!Number.isSafeInteger(expiration) || expiration <= now || expiration > now + SESSION_TTL_MS) return false;
  return equal(match[3], signature(`${match[1]}.${match[2]}`, serviceToken));
}
