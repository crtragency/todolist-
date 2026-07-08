'use client';

import { useTheme, THEME_COLORS, type ThemeMode } from '@/lib/theme';
import { Icon } from './Icons';

export default function ThemeMenu({ onClose }: { onClose: () => void }) {
  const { mode, color, changeMode, changeColor } = useTheme();
  const modes: { id: ThemeMode; label: string }[] = [
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
    { id: 'system', label: 'System' },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={onClose}>
      <div className="card w-full max-w-xs p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Appearance</h2>
          <button className="btn-ghost p-1.5" onClick={onClose}>
            <Icon.Close />
          </button>
        </div>

        <label className="mb-1.5 block text-xs font-medium text-muted">Mode</label>
        <div className="mb-4 flex rounded-lg bg-surface-2 p-1 text-sm">
          {modes.map((m) => (
            <button
              key={m.id}
              className={`flex-1 rounded-md py-1.5 font-medium transition ${
                mode === m.id ? 'bg-surface shadow-sm' : 'text-muted'
              }`}
              onClick={() => changeMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>

        <label className="mb-1.5 block text-xs font-medium text-muted">Accent color</label>
        <div className="flex flex-wrap gap-2">
          {THEME_COLORS.map((c) => (
            <button
              key={c.id}
              className={`flex h-9 w-9 items-center justify-center rounded-full ${
                color === c.id ? 'ring-2 ring-offset-2 ring-offset-surface' : ''
              }`}
              style={{ backgroundColor: c.swatch }}
              onClick={() => changeColor(c.id)}
              title={c.name}
              aria-label={c.name}
            >
              {color === c.id && <Icon.Check width={16} height={16} className="text-white" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
