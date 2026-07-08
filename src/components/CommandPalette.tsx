'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore, type ActiveView } from '@/lib/store';
import { api } from '@/lib/client';
import { Icon } from './Icons';
import { useTheme } from '@/lib/theme';
import type { TaskDTO } from '@/lib/types';

interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  run: () => void;
}

export default function CommandPalette({ onClose }: { onClose: () => void }) {
  const { projects, labels, filters, setView, selectTask } = useStore();
  const { toggleDark } = useTheme();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<TaskDTO[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced task search.
  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      api
        .get<{ tasks: TaskDTO[] }>(`/api/tasks?search=${encodeURIComponent(q.trim())}`)
        .then((d) => setResults(d.tasks.slice(0, 6)))
        .catch(() => {});
    }, 180);
    return () => clearTimeout(t);
  }, [q]);

  const nav = (view: ActiveView) => {
    setView(view);
    onClose();
  };

  const commands = useMemo<Command[]>(() => {
    const base: Command[] = [
      { id: 'today', label: 'Go to Today', icon: <Icon.Today width={16} height={16} />, run: () => nav({ kind: 'today', title: 'Today' }) },
      { id: 'upcoming', label: 'Go to Upcoming', icon: <Icon.Upcoming width={16} height={16} />, run: () => nav({ kind: 'upcoming', title: 'Upcoming' }) },
      { id: 'inbox', label: 'Go to Inbox', icon: <Icon.Inbox width={16} height={16} />, run: () => nav({ kind: 'inbox', title: 'Inbox' }) },
      { id: 'overdue', label: 'Go to Overdue', icon: <Icon.Overdue width={16} height={16} />, run: () => nav({ kind: 'overdue', title: 'Overdue' }) },
      { id: 'completed', label: 'Go to Completed', icon: <Icon.CheckCircle width={16} height={16} />, run: () => nav({ kind: 'completed', title: 'Completed' }) },
      { id: 'dashboard', label: 'Open Dashboard', icon: <Icon.Chart width={16} height={16} />, run: () => nav({ kind: 'dashboard', title: 'Dashboard' }) },
      { id: 'theme', label: 'Toggle dark mode', icon: <Icon.Moon width={16} height={16} />, run: () => { toggleDark(); onClose(); } },
    ];
    for (const p of projects) {
      base.push({
        id: `proj-${p.id}`,
        label: `${p.name}`,
        hint: 'Project',
        icon: <span className="text-base leading-none">{p.icon}</span>,
        run: () => nav({ kind: 'project', id: p.id, title: p.name }),
      });
    }
    for (const l of labels) {
      base.push({
        id: `label-${l.id}`,
        label: `@${l.name}`,
        hint: 'Label',
        icon: <Icon.Tag width={16} height={16} />,
        run: () => nav({ kind: 'label', id: l.id, title: l.name }),
      });
    }
    for (const f of filters) {
      base.push({
        id: `filter-${f.id}`,
        label: f.name,
        hint: 'Filter',
        icon: <Icon.Filter width={16} height={16} />,
        run: () => nav({ kind: 'filter', id: f.id, title: f.name, query: f.query }),
      });
    }
    return base;
  }, [projects, labels, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredCommands = useMemo(() => {
    if (!q.trim()) return commands.slice(0, 8);
    const lower = q.toLowerCase();
    return commands.filter((c) => c.label.toLowerCase().includes(lower)).slice(0, 8);
  }, [commands, q]);

  // Flatten items for keyboard nav: search-as-task action, commands, task results.
  const searchAction: Command = {
    id: 'search',
    label: `Search for “${q}”`,
    icon: <Icon.Search width={16} height={16} />,
    run: () => nav({ kind: 'search', title: `Search: ${q}`, query: q.trim() }),
  };

  const items: Command[] = [
    ...(q.trim().length >= 2 ? [searchAction] : []),
    ...filteredCommands,
    ...results.map<Command>((t) => ({
      id: `task-${t.id}`,
      label: t.title,
      hint: 'Task',
      icon: <Icon.CheckCircle width={16} height={16} />,
      run: () => {
        selectTask(t.id);
        onClose();
      },
    })),
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/40 px-4 pt-[12vh]" onClick={onClose}>
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Icon.Search className="text-muted" width={18} height={18} />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent py-3.5 text-sm outline-none placeholder:text-muted"
            placeholder="Search tasks or jump to…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, items.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                items[active]?.run();
              } else if (e.key === 'Escape') {
                onClose();
              }
            }}
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted">ESC</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-1.5">
          {items.length === 0 && <div className="px-3 py-6 text-center text-sm text-muted">No matches</div>}
          {items.map((c, i) => (
            <button
              key={c.id}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${
                i === active ? 'bg-accent/10 text-accent' : 'hover:bg-surface-2'
              }`}
              onMouseEnter={() => setActive(i)}
              onClick={() => c.run()}
            >
              <span className={i === active ? 'text-accent' : 'text-muted'}>{c.icon}</span>
              <span className="flex-1 truncate">{c.label}</span>
              {c.hint && <span className="text-xs text-muted">{c.hint}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
