'use client';

import { useMemo } from 'react';
import TaskRow from './TaskRow';
import { type TaskDTO } from '@/lib/types';
import { bucketFor, formatDueLabel } from '@/lib/date';
import type { ViewKind } from '@/lib/store';
import { Icon } from './Icons';

const EMPTY: Record<string, { emoji: string; title: string; sub: string }> = {
  today: { emoji: '☀️', title: 'Nothing due today', sub: 'Enjoy the calm, or add a task above.' },
  upcoming: { emoji: '📅', title: 'Nothing upcoming', sub: 'Schedule tasks and they’ll show up here.' },
  overdue: { emoji: '🎉', title: 'No overdue tasks', sub: 'You’re all caught up.' },
  completed: { emoji: '✅', title: 'No completed tasks yet', sub: 'Finished tasks land here.' },
  inbox: { emoji: '📥', title: 'Inbox zero', sub: 'Add a task above to get started.' },
  project: { emoji: '🗂️', title: 'No tasks in this project', sub: 'Add your first task above.' },
  label: { emoji: '🏷️', title: 'No tasks with this label', sub: '' },
  filter: { emoji: '🔍', title: 'No tasks match this filter', sub: '' },
  search: { emoji: '🔍', title: 'No results', sub: 'Try a different search term.' },
};

export default function TaskList({ tasks, emptyKind }: { tasks: TaskDTO[]; emptyKind: ViewKind }) {
  // For Upcoming, group tasks by due date. Otherwise a single list.
  const groups = useMemo(() => {
    if (emptyKind !== 'upcoming') return null;
    const byDate = new Map<string, TaskDTO[]>();
    for (const t of tasks) {
      const key = t.dueDate ? t.dueDate.slice(0, 10) : 'nodate';
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key)!.push(t);
    }
    return [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [tasks, emptyKind]);

  if (tasks.length === 0) {
    const e = EMPTY[emptyKind] ?? EMPTY.project;
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-3 text-5xl">{e.emoji}</div>
        <h3 className="text-base font-semibold">{e.title}</h3>
        {e.sub && <p className="mt-1 max-w-xs text-sm text-muted">{e.sub}</p>}
      </div>
    );
  }

  if (groups) {
    return (
      <div className="space-y-6">
        {groups.map(([key, list]) => (
          <div key={key}>
            <h3 className="mb-1 flex items-center gap-2 px-1 text-sm font-semibold">
              <Icon.Calendar width={14} height={14} className="text-muted" />
              {key === 'nodate' ? 'No date' : formatDueLabel(new Date(key).toISOString())}
              <span className="text-xs font-normal text-muted">{list.length}</span>
            </h3>
            <div>
              {list.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {tasks.map((t) => (
        <TaskRow key={t.id} task={t} />
      ))}
    </div>
  );
}
