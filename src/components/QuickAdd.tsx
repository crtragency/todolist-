'use client';

import { useMemo, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { parseQuickAdd } from '@/lib/nlp';
import { formatDueLabel } from '@/lib/date';
import { Icon } from './Icons';
import { PRIORITY_META } from '@/lib/types';

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
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const parsed = useMemo(() => (value.trim() ? parseQuickAdd(value) : null), [value]);

  async function submit() {
    const p = parseQuickAdd(value);
    if (!p.title.trim()) return;
    setBusy(true);
    try {
      // Resolve project by name if one was typed.
      let projectId = defaultProjectId;
      if (p.projectName) {
        const match = projects.find(
          (pr) => pr.name.toLowerCase() === p.projectName!.toLowerCase(),
        );
        if (match) projectId = match.id;
      }
      await createTask({
        title: p.title,
        projectId,
        parentTaskId: parentTaskId ?? null,
        dueDate: p.dueDate,
        dueTime: p.dueTime,
        priority: p.priority ?? undefined,
        recurrence: p.recurrence,
        labelNames: p.labelNames,
      });
      setValue('');
      onDone?.();
      inputRef.current?.focus();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-4">
      <div
        className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-colors ${
          focused ? 'border-accent bg-surface' : 'border-border bg-surface'
        }`}
      >
        <button
          className="text-accent"
          onClick={submit}
          disabled={busy || !parsed?.title}
          title="Add task"
        >
          <Icon.Plus />
        </button>
        <input
          ref={inputRef}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
          placeholder={placeholder ?? 'Add a task…  e.g. “Report tomorrow 5pm #Work @laptop p1”'}
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
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

      {/* Parsed token preview */}
      {parsed && (parsed.dueDate || parsed.priority || parsed.projectName || parsed.labelNames.length > 0 || parsed.recurrence) && (
        <div className="mt-2 flex flex-wrap gap-1.5 pl-1 text-xs animate-fade-in">
          {parsed.dueDate && (
            <Chip color="#1971c2">
              <Icon.Calendar width={12} height={12} />
              {formatDueLabel(parsed.dueDate, parsed.dueTime)}
            </Chip>
          )}
          {parsed.recurrence && (
            <Chip color="#7c4dff">
              <Icon.Repeat width={12} height={12} />
              {parsed.recurrence}
            </Chip>
          )}
          {parsed.priority && (
            <Chip color={PRIORITY_META[parsed.priority].color}>
              <Icon.Flag width={12} height={12} />
              {parsed.priority}
            </Chip>
          )}
          {parsed.projectName && (
            <Chip color="#16a34a">
              <Icon.Hash width={12} height={12} />
              {parsed.projectName}
            </Chip>
          )}
          {parsed.labelNames.map((l) => (
            <Chip key={l} color="#f08c00">
              <Icon.Tag width={12} height={12} />
              {l}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium"
      style={{ backgroundColor: `${color}1a`, color }}
    >
      {children}
    </span>
  );
}
