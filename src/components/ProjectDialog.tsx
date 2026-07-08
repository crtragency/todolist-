'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';

const COLORS = ['#e03131', '#f08c00', '#f59f00', '#2f9e44', '#16a34a', '#1971c2', '#7048e8', '#db2777', '#0d9488', '#868e96'];
const ICONS = ['📥', '📝', '💼', '🏠', '🎯', '🚀', '📚', '💪', '🛒', '✈️', '🎨', '💡', '🔧', '❤️', '🌱', '⭐'];

export default function ProjectDialog({ onClose }: { onClose: () => void }) {
  const createProject = useStore((s) => s.createProject);
  const setView = useStore((s) => s.setView);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[5]);
  const [icon, setIcon] = useState(ICONS[1]);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const project = await createProject(name.trim(), color, icon);
      if (project) setView({ kind: 'project', id: project.id, title: project.name });
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form
        className="card w-full max-w-sm p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <h2 className="mb-4 text-lg font-bold">New project</h2>

        <label className="mb-1 block text-xs font-medium text-muted">Name</label>
        <input
          className="input mb-4"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Work, Home, Fitness"
          autoFocus
        />

        <label className="mb-1.5 block text-xs font-medium text-muted">Color</label>
        <div className="mb-4 flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`h-6 w-6 rounded-full ${color === c ? 'ring-2 ring-offset-2 ring-offset-surface' : ''}`}
              style={{ backgroundColor: c, boxShadow: color === c ? `0 0 0 2px ${c}` : undefined }}
              onClick={() => setColor(c)}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>

        <label className="mb-1.5 block text-xs font-medium text-muted">Icon</label>
        <div className="mb-5 flex flex-wrap gap-1.5">
          {ICONS.map((i) => (
            <button
              key={i}
              type="button"
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-lg ${
                icon === i ? 'bg-accent/15 ring-1 ring-accent' : 'hover:bg-surface-2'
              }`}
              onClick={() => setIcon(i)}
            >
              {i}
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={busy || !name.trim()}>
            Create
          </button>
        </div>
      </form>
    </div>
  );
}
