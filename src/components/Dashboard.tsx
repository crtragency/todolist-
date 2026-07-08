'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { useStore } from '@/lib/store';
import { Icon } from './Icons';

interface Stats {
  total: number;
  completed: number;
  active: number;
  overdue: number;
  karma: number;
  streak: number;
  perDay: { date: string; count: number }[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const user = useStore((s) => s.user);

  useEffect(() => {
    api.get<Stats>('/api/stats').then(setStats).catch(() => {});
  }, []);

  if (!stats) {
    return <div className="p-8 text-sm text-muted">Loading stats…</div>;
  }

  const max = Math.max(1, ...stats.perDay.map((d) => d.count));
  const completionRate = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Good to see you, {user?.name?.split(' ')[0] ?? 'there'} 👋</h1>
        <p className="text-sm text-muted">Here’s how your productivity is trending.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<Icon.List />} label="Active" value={stats.active} tint="#1971c2" />
        <StatCard icon={<Icon.CheckCircle />} label="Completed" value={stats.completed} tint="#16a34a" />
        <StatCard icon={<Icon.Overdue />} label="Overdue" value={stats.overdue} tint="#e03131" />
        <StatCard icon={<Icon.Flag />} label="Karma" value={stats.karma} tint="#f08c00" />
      </div>

      {/* Completion rate */}
      <div className="card mt-4 p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold">Completion rate</span>
          <span className="text-muted">{completionRate}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${completionRate}%` }} />
        </div>
      </div>

      {/* 7-day activity */}
      <div className="card mt-4 p-4">
        <h3 className="mb-3 text-sm font-semibold">Completed — last 7 days</h3>
        <div className="flex items-end justify-between gap-2" style={{ height: 120 }}>
          {stats.perDay.map((d) => {
            const h = (d.count / max) * 100;
            const label = new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' });
            return (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md bg-accent/80 transition-all"
                    style={{ height: `${Math.max(4, h)}%` }}
                    title={`${d.count} completed`}
                  />
                </div>
                <span className="text-[10px] text-muted">{label}</span>
                <span className="text-[10px] font-medium">{d.count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Eisenhower matrix hint */}
      <EisenhowerMatrix />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tint: string;
}) {
  return (
    <div className="card p-3">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${tint}1a`, color: tint }}>
        {icon}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

// Eisenhower matrix built from the current active task list (priority = importance,
// due today/overdue = urgent).
function EisenhowerMatrix() {
  const tasks = useStore((s) => s.tasks);
  const setView = useStore((s) => s.setView);
  const [loaded, setLoaded] = useState<typeof tasks>([]);

  useEffect(() => {
    api
      .get<{ tasks: typeof tasks }>('/api/tasks?view=today')
      .then((d) => setLoaded(d.tasks))
      .catch(() => {});
  }, []);

  const isUrgent = (p: string) => p === 'P1' || p === 'P2';
  const quadrants = [
    { title: 'Do first', sub: 'Urgent & important', list: loaded.filter((t) => isUrgent(t.priority)), tint: '#e03131' },
    { title: 'Schedule', sub: 'Important, not urgent', list: loaded.filter((t) => t.priority === 'P3'), tint: '#1971c2' },
    { title: 'Delegate', sub: 'Urgent, not important', list: [], tint: '#f08c00' },
    { title: 'Eliminate', sub: 'Neither', list: loaded.filter((t) => t.priority === 'P4'), tint: '#868e96' },
  ];

  return (
    <div className="card mt-4 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Eisenhower matrix — today</h3>
        <button className="text-xs text-accent" onClick={() => setView({ kind: 'today', title: 'Today' })}>
          Open Today →
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {quadrants.map((q) => (
          <div key={q.title} className="rounded-lg border border-border p-2.5">
            <div className="mb-1 text-xs font-semibold" style={{ color: q.tint }}>
              {q.title}
            </div>
            <div className="mb-1.5 text-[10px] text-muted">{q.sub}</div>
            <div className="space-y-1">
              {q.list.slice(0, 4).map((t) => (
                <div key={t.id} className="truncate text-xs">
                  • {t.title}
                </div>
              ))}
              {q.list.length === 0 && <div className="text-[10px] text-muted">—</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
