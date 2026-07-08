'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { Icon } from './Icons';

export default function Settings({ onClose }: { onClose: () => void }) {
  // Close on Escape.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const user = useStore((s) => s.user);
  const updateProfile = useStore((s) => s.updateProfile);
  const changePassword = useStore((s) => s.changePassword);

  const [name, setName] = useState(user?.name ?? '');
  const [savingName, setSavingName] = useState(false);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState('');

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || name.trim() === user?.name) return;
    setSavingName(true);
    try {
      await updateProfile(name.trim());
    } finally {
      setSavingName(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError('');
    if (next.length < 6) return setPwError('New password must be at least 6 characters');
    if (next !== confirm) return setPwError('Passwords do not match');
    setPwBusy(true);
    try {
      await changePassword(current, next);
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      setPwError((err as Error).message);
    } finally {
      setPwBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="card w-full max-w-md p-0 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-lg font-bold">Settings</h2>
          <button className="btn-ghost p-1.5" onClick={onClose} aria-label="Close">
            <Icon.Close />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-6 overflow-y-auto px-5 py-5">
          {/* Profile */}
          <section>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-lg font-semibold text-accent-fg">
                {(name?.[0] ?? user?.name?.[0] ?? 'U').toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{user?.name}</div>
                <div className="truncate text-xs text-muted">{user?.email}</div>
              </div>
            </div>

            <form onSubmit={saveName}>
              <label className="mb-1 block text-xs font-medium text-muted">Display name</label>
              <div className="flex gap-2">
                <input
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  maxLength={80}
                />
                <button
                  type="submit"
                  className="btn-primary shrink-0"
                  disabled={savingName || !name.trim() || name.trim() === user?.name}
                >
                  {savingName ? '…' : 'Save'}
                </button>
              </div>
            </form>

            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-muted">Email</label>
              <input className="input opacity-60" value={user?.email ?? ''} disabled readOnly />
            </div>
          </section>

          <div className="h-px bg-border" />

          {/* Password */}
          <section>
            <h3 className="mb-3 text-sm font-semibold">Change password</h3>
            <form onSubmit={savePassword} className="space-y-2.5">
              <input
                type="password"
                className="input"
                placeholder="Current password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                autoComplete="current-password"
                required
              />
              <input
                type="password"
                className="input"
                placeholder="New password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
              <input
                type="password"
                className="input"
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
              {pwError && <p className="text-sm text-p1">{pwError}</p>}
              <button
                type="submit"
                className="btn-primary w-full"
                disabled={pwBusy || !current || !next || !confirm}
              >
                {pwBusy ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </section>

          <div className="h-px bg-border" />

          {/* Account stats + logout */}
          <section className="flex items-center justify-between">
            <div className="text-xs text-muted">
              ⚡ {user?.karma ?? 0} karma · 🔥 {user?.streak ?? 0} day streak
            </div>
            <button
              className="btn-ghost gap-2 text-sm text-p1"
              onClick={() => useStore.getState().logout()}
            >
              <Icon.Logout width={16} height={16} /> Log out
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
