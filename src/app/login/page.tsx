'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'register') {
        await api.post('/api/auth/register', { name, email, password });
      } else {
        await api.post('/api/auth/login', { email, password });
      }
      router.push('/');
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function demo() {
    setError('');
    setBusy(true);
    try {
      // Try to log into the seeded demo account; if it doesn't exist, register it.
      try {
        await api.post('/api/auth/login', { email: 'demo@everything.app', password: 'demodemo' });
      } catch {
        await api.post('/api/auth/register', {
          name: 'Demo',
          email: 'demo@everything.app',
          password: 'demodemo',
        });
      }
      router.push('/');
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-2xl text-accent-fg shadow-lg">
            ✓
          </div>
          <h1 className="text-2xl font-bold">Everything</h1>
          <p className="mt-1 text-sm text-muted">Your tasks, focused and in one place.</p>
        </div>

        <div className="card p-6 shadow-sm">
          <div className="mb-4 flex rounded-lg bg-surface-2 p-1 text-sm">
            <button
              className={`flex-1 rounded-md py-1.5 font-medium transition ${mode === 'login' ? 'bg-surface shadow-sm' : 'text-muted'}`}
              onClick={() => setMode('login')}
              type="button"
            >
              Log in
            </button>
            <button
              className={`flex-1 rounded-md py-1.5 font-medium transition ${mode === 'register' ? 'bg-surface shadow-sm' : 'text-muted'}`}
              onClick={() => setMode('register')}
              type="button"
            >
              Sign up
            </button>
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === 'register' && (
              <input
                className="input"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            )}
            <input
              className="input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <input
              className="input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            />
            {error && <p className="text-sm text-p1">{error}</p>}
            <button className="btn-primary w-full" disabled={busy} type="submit">
              {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs text-muted">
            <div className="h-px flex-1 bg-border" />
            or
            <div className="h-px flex-1 bg-border" />
          </div>

          <button className="btn-ghost w-full border border-border" onClick={demo} disabled={busy} type="button">
            Try the demo account
          </button>
        </div>
        <p className="mt-4 text-center text-xs text-muted">
          Built with Next.js · Works offline · Data stays private to your account
        </p>
      </div>
    </main>
  );
}
