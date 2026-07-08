'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { parseQuickAdd } from '@/lib/nlp';
import { formatDueLabel, addDays, startOfDay } from '@/lib/date';
import { Icon } from './Icons';
import { PRIORITY_META, type Priority } from '@/lib/types';

export default function QuickAdd({
  defaultProjectId,
  parentTaskId,
  autoFocus,
  onDone,
  placeholder,
}: {
  defaultProjectId?: string;
  parentTaskId?: string;
  autoFocus?: boolean;
  onDone?: () => void;
  placeholder?: string;
}) {
  const createTask = useStore((s) => s.createTask);
  const projects = useStore((s) => s.projects);
  const labels = useStore((s) => s.labels);

  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Explicit picker selections. These override anything parsed from the text.
  const [pickDate, setPickDate] = useState<string | null>(null); // ISO
  const [pickTime, setPickTime] = useState<string | null>(null);
  const [pickPriority, setPickPriority] = useState<Priority | null>(null);
  const [pickProjectId, setPickProjectId] = useState<string | null>(defaultProjectId ?? null);
  const [pickLabels, setPickLabels] = useState<string[]>([]);
  const [openMenu, setOpenMenu] = useState<null | 'date' | 'priority' | 'project' | 'label'>(null);

  useEffect(() => {
    setPickProjectId(defaultProjectId ?? null);
  }, [defaultProjectId]);

  const parsed = useMemo(() => (value.trim() ? parseQuickAdd(value) : null), [value]);

  // Effective values = explicit picker ?? parsed-from-text.
  const effDate = pickDate ?? parsed?.dueDate ?? null;
  const effTime = pickTime ?? parsed?.dueTime ?? null;
  const effPriority = pickPriority ?? parsed?.priority ?? null;
  const effLabels = Array.from(new Set([...(parsed?.labelNames ?? []), ...pickLabels]));

  const parsedProject = parsed?.projectName
    ? projects.find((p) => p.name.toLowerCase() === parsed.projectName!.toLowerCase())
    : undefined;
  const effProjectId = pickProjectId ?? parsedProject?.id ?? defaultProjectId ?? null;
  const effProject = projects.find((p) => p.id === effProjectId);

  function reset() {
    setValue('');
    setPickDate(null);
    setPickTime(null);
    setPickPriority(null);
    setPickLabels([]);
    setPickProjectId(defaultProjectId ?? null);
    setOpenMenu(null);
  }

  async function submit() {
    const p = parseQuickAdd(value);
    if (!p.title.trim()) return;
    setBusy(true);
    try {
      await createTask({
        title: p.title,
        projectId: effProjectId ?? undefined,
        parentTaskId: parentTaskId ?? null,
        dueDate: effDate,
        dueTime: effTime,
        priority: effPriority ?? undefined,
        recurrence: p.recurrence,
        labelNames: effLabels,
      });
      reset();
      onDone?.();
      inputRef.current?.focus();
    } finally {
      setBusy(false);
    }
  }

  const toggleLabel = (name: string) =>
    setPickLabels((prev) => (prev.includes(name) ? prev.filter((l) => l !== name) : [...prev, name]));

  return (
    <div className="mb-4 rounded-xl border border-border bg-surface focus-within:border-accent">
      {/* Text input */}
      <div className="flex items-center gap-2 px-3 pt-2.5">
        <button className="text-accent" onClick={submit} disabled={busy || !parsed?.title} title="Add task">
          <Icon.Plus />
        </button>
        <input
          ref={inputRef}
          className="flex-1 bg-transparent py-0.5 text-sm outline-none placeholder:text-muted"
          placeholder={placeholder ?? 'Add a task…  e.g. “Report tomorrow 5pm #Work @laptop p1”'}
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            } else if (e.key === 'Escape') {
              onDone?.();
            }
          }}
        />
      </div>

      {/* Picker toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 px-3 pb-2.5 pt-2">
        {/* Date */}
        <ToolButton
          active={!!effDate}
          color="#1971c2"
          icon={<Icon.Calendar width={14} height={14} />}
          label={effDate ? formatDueLabel(effDate, effTime) : 'Date'}
          onClick={() => setOpenMenu(openMenu === 'date' ? null : 'date')}
        >
          {openMenu === 'date' && (
            <Menu onClose={() => setOpenMenu(null)}>
              <MenuItem onClick={() => { setPickDate(startOfDay(new Date()).toISOString()); setOpenMenu(null); }}>☀️ Today</MenuItem>
              <MenuItem onClick={() => { setPickDate(startOfDay(addDays(new Date(), 1)).toISOString()); setOpenMenu(null); }}>🌄 Tomorrow</MenuItem>
              <MenuItem onClick={() => { setPickDate(startOfDay(addDays(new Date(), 7)).toISOString()); setOpenMenu(null); }}>📅 Next week</MenuItem>
              <div className="my-1 h-px bg-border" />
              <div className="px-2 py-1">
                <input
                  type="date"
                  className="w-full rounded-md border border-border bg-surface px-2 py-1 text-xs"
                  value={effDate ? effDate.slice(0, 10) : ''}
                  onChange={(e) => setPickDate(e.target.value ? new Date(e.target.value).toISOString() : null)}
                />
                <input
                  type="time"
                  className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-1 text-xs"
                  value={effTime ?? ''}
                  onChange={(e) => setPickTime(e.target.value || null)}
                />
              </div>
              {effDate && (
                <>
                  <div className="my-1 h-px bg-border" />
                  <MenuItem onClick={() => { setPickDate(null); setPickTime(null); setOpenMenu(null); }}>
                    ✕ Clear date
                  </MenuItem>
                </>
              )}
            </Menu>
          )}
        </ToolButton>

        {/* Priority */}
        <ToolButton
          active={!!effPriority}
          color={effPriority ? PRIORITY_META[effPriority].color : undefined}
          icon={<Icon.Flag width={14} height={14} />}
          label={effPriority ?? 'Priority'}
          onClick={() => setOpenMenu(openMenu === 'priority' ? null : 'priority')}
        >
          {openMenu === 'priority' && (
            <Menu onClose={() => setOpenMenu(null)}>
              {(['P1', 'P2', 'P3', 'P4'] as Priority[]).map((p) => (
                <MenuItem key={p} onClick={() => { setPickPriority(p); setOpenMenu(null); }}>
                  <span className="flex items-center gap-2">
                    <Icon.Flag width={14} height={14} style={{ color: PRIORITY_META[p].color }} />
                    {PRIORITY_META[p].label}
                  </span>
                </MenuItem>
              ))}
              {effPriority && (
                <>
                  <div className="my-1 h-px bg-border" />
                  <MenuItem onClick={() => { setPickPriority(null); setOpenMenu(null); }}>✕ Clear</MenuItem>
                </>
              )}
            </Menu>
          )}
        </ToolButton>

        {/* Project */}
        <ToolButton
          active={!!effProject && !effProject.isInbox}
          color={effProject?.color}
          icon={<span className="text-sm leading-none">{effProject?.icon ?? '#'}</span>}
          label={effProject?.name ?? 'Project'}
          onClick={() => setOpenMenu(openMenu === 'project' ? null : 'project')}
        >
          {openMenu === 'project' && (
            <Menu onClose={() => setOpenMenu(null)}>
              {projects.map((p) => (
                <MenuItem key={p.id} onClick={() => { setPickProjectId(p.id); setOpenMenu(null); }}>
                  <span className="flex items-center gap-2">
                    <span style={{ color: p.color }}>{p.icon}</span>
                    {p.name}
                  </span>
                </MenuItem>
              ))}
            </Menu>
          )}
        </ToolButton>

        {/* Labels */}
        <ToolButton
          active={effLabels.length > 0}
          color="#f08c00"
          icon={<Icon.Tag width={14} height={14} />}
          label={effLabels.length ? effLabels.join(', ') : 'Labels'}
          onClick={() => setOpenMenu(openMenu === 'label' ? null : 'label')}
        >
          {openMenu === 'label' && (
            <Menu onClose={() => setOpenMenu(null)}>
              {labels.length === 0 && <div className="px-2 py-1 text-xs text-muted">No labels yet — type one below</div>}
              {labels.map((l) => (
                <MenuItem key={l.id} onClick={() => toggleLabel(l.name)}>
                  <span className="flex w-full items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <Icon.Tag width={14} height={14} style={{ color: l.color }} />
                      {l.name}
                    </span>
                    {effLabels.includes(l.name) && <Icon.Check width={14} height={14} className="text-accent" />}
                  </span>
                </MenuItem>
              ))}
              <div className="my-1 h-px bg-border" />
              <div className="px-2 py-1">
                <input
                  className="w-full rounded-md border border-border bg-surface px-2 py-1 text-xs"
                  placeholder="New label + Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const v = (e.target as HTMLInputElement).value.trim();
                      if (v) {
                        toggleLabel(v);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                />
              </div>
            </Menu>
          )}
        </ToolButton>

        <div className="ml-auto">
          <button className="btn-primary px-4 py-1 text-xs" onClick={submit} disabled={busy || !parsed?.title}>
            Add task
          </button>
        </div>
      </div>
    </div>
  );
}

function ToolButton({
  active,
  color,
  icon,
  label,
  onClick,
  children,
}: {
  active: boolean;
  color?: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative">
      <button
        onClick={onClick}
        className={`inline-flex max-w-[160px] items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-medium transition-colors ${
          active ? 'border-current' : 'border-border text-muted hover:bg-surface-2'
        }`}
        style={active && color ? { color } : undefined}
      >
        {icon}
        <span className="truncate">{label}</span>
      </button>
      {children}
    </div>
  );
}

function Menu({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  // Close on any pointer-down outside this menu. No blocking overlay, so
  // clicking a different picker button switches menus in a single click.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    // Defer so the opening click doesn't immediately close the menu.
    const id = setTimeout(() => document.addEventListener('mousedown', onDown), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener('mousedown', onDown);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute left-0 z-30 mt-1 max-h-72 w-52 overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-lg animate-fade-in"
    >
      {children}
    </div>
  );
}

function MenuItem({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm hover:bg-surface-2"
    >
      {children}
    </button>
  );
}
