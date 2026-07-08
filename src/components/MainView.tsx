'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { Icon } from './Icons';
import QuickAdd from './QuickAdd';
import TaskList from './TaskList';
import BoardView from './BoardView';
import Dashboard from './Dashboard';
import BulkBar from './BulkBar';
import { PRIORITY_META } from '@/lib/types';

type SortKey = 'default' | 'priority' | 'dueDate' | 'title';

export default function MainView() {
  const view = useStore((s) => s.view);
  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);
  const selectedIds = useStore((s) => s.selectedIds);
  const [sort, setSort] = useState<SortKey>('default');
  const [layout, setLayout] = useState<'list' | 'board'>('list');

  const currentProject =
    view.kind === 'project' ? projects.find((p) => p.id === view.id) : undefined;

  const sortedTasks = useMemo(() => {
    const copy = [...tasks];
    if (sort === 'priority')
      copy.sort((a, b) => PRIORITY_META[a.priority].rank - PRIORITY_META[b.priority].rank);
    else if (sort === 'dueDate')
      copy.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
    else if (sort === 'title') copy.sort((a, b) => a.title.localeCompare(b.title));
    return copy;
  }, [tasks, sort]);

  const activeCount = tasks.filter((t) => !t.completed).length;
  const effectiveLayout = currentProject?.viewType === 'board' || layout === 'board' ? 'board' : 'list';
  const showBoardToggle = view.kind === 'project';

  if (view.kind === 'dashboard') {
    return (
      <main className="flex-1 overflow-y-auto">
        <Dashboard />
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-bg px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {currentProject && (
                <span className="text-xl leading-none" style={{ color: currentProject.color }}>
                  {currentProject.icon}
                </span>
              )}
              <h1 className="truncate text-xl font-bold">{view.title}</h1>
            </div>
            {view.kind === 'filter' && view.query && (
              <p className="mt-0.5 font-mono text-xs text-muted">{view.query}</p>
            )}
            <p className="mt-0.5 text-xs text-muted">
              {activeCount} {activeCount === 1 ? 'task' : 'tasks'}
            </p>
          </div>

          <div className="flex items-center gap-1">
            {showBoardToggle && (
              <div className="mr-1 hidden rounded-lg border border-border p-0.5 sm:flex">
                <button
                  className={`rounded-md p-1.5 ${effectiveLayout === 'list' ? 'bg-surface-2 text-fg' : 'text-muted'}`}
                  onClick={() => setLayout('list')}
                  title="List view"
                >
                  <Icon.List width={16} height={16} />
                </button>
                <button
                  className={`rounded-md p-1.5 ${effectiveLayout === 'board' ? 'bg-surface-2 text-fg' : 'text-muted'}`}
                  onClick={() => setLayout('board')}
                  title="Board view"
                >
                  <Icon.Board width={16} height={16} />
                </button>
              </div>
            )}
            <SortMenu sort={sort} onChange={setSort} />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {view.kind !== 'completed' && (
            <QuickAdd
              defaultProjectId={
                view.kind === 'project' || view.kind === 'inbox' ? view.id : undefined
              }
            />
          )}

          {effectiveLayout === 'board' && view.kind === 'project' && currentProject ? (
            <BoardView project={currentProject} tasks={sortedTasks} />
          ) : (
            <TaskList tasks={sortedTasks} emptyKind={view.kind} />
          )}
        </div>
      </div>

      {selectedIds.size > 0 && <BulkBar />}
    </main>
  );
}

function SortMenu({ sort, onChange }: { sort: SortKey; onChange: (s: SortKey) => void }) {
  const [open, setOpen] = useState(false);
  const options: { key: SortKey; label: string }[] = [
    { key: 'default', label: 'Default order' },
    { key: 'priority', label: 'Priority' },
    { key: 'dueDate', label: 'Due date' },
    { key: 'title', label: 'Name' },
  ];
  return (
    <div className="relative">
      <button className="btn-ghost gap-1.5 px-2 py-1.5 text-sm" onClick={() => setOpen((v) => !v)}>
        <Icon.Filter width={16} height={16} />
        <span className="hidden sm:inline">Sort</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-border bg-surface p-1 shadow-lg">
            {options.map((o) => (
              <button
                key={o.key}
                className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-sm hover:bg-surface-2 ${
                  sort === o.key ? 'text-accent' : ''
                }`}
                onClick={() => {
                  onChange(o.key);
                  setOpen(false);
                }}
              >
                {o.label}
                {sort === o.key && <Icon.Check width={14} height={14} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
