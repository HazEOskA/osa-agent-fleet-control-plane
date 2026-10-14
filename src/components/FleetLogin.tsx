import { useState, type FormEvent } from 'react';

export function FleetLogin({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!res.ok || !json.authenticated) {
        throw new Error(res.status === 503
          ? 'Operator access not configured: set OSA_FLEET_OPERATOR_PASSWORD and OSA_FLEET_SERVICE_TOKEN on the server.'
          : 'Access denied. Check credentials.');
      }
      setPassword('');
      onAuthenticated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not log in');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-5 text-neutral-100">
      <form onSubmit={login} className="w-full max-w-md space-y-5 rounded-xl border border-neutral-700 bg-neutral-900 p-7 shadow-xl">
        <div>
          <h1 className="text-xl font-semibold">OSA Agent Fleet</h1>
          <p className="mt-2 text-sm text-neutral-400">Operator login · service credentials never reach the browser.</p>
        </div>
        <label htmlFor="fleet-operator-password" className="block text-sm">Operator password</label>
        <input id="fleet-operator-password" type="password" value={password}
          onChange={e => setPassword(e.target.value)} autoComplete="current-password"
          disabled={busy} required className="w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-3 text-neutral-100" />
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={busy || !password}
          className="w-full rounded-lg bg-neutral-100 px-4 py-3 font-semibold text-neutral-900 disabled:opacity-50">
          {busy ? 'Verifying…' : 'Enter Fleet'}
        </button>
      </form>
    </div>
  );
}
