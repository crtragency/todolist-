'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import Sidebar from './Sidebar';
import MainView from './MainView';
import TaskDetail from './TaskDetail';
import Toasts from './Toasts';
import CommandPalette from './CommandPalette';
import { Icon } from './Icons';

export default function AppShell() {
  const bootstrap = useStore((s) => s.bootstrap);
  const loading = useStore((s) => s.loading);
  const selectedTaskId = useStore((s) => s.selectedTaskId);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  // Global keyboard shortcut: Cmd/Ctrl+K opens the command palette.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg text-muted">
        <div className="animate-pulse text-sm">Loading your tasks…</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg text-fg">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenPalette={() => setPaletteOpen(true)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div className="flex items-center gap-2 border-b border-border bg-surface px-3 py-2 md:hidden">
          <button className="btn-ghost p-2" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Icon.Menu />
          </button>
          <span className="font-semibold">Everything</span>
        </div>

        <MainView />
      </div>

      {selectedTaskId && <TaskDetail />}
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
      <Toasts />
    </div>
  );
}
