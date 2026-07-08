'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { api } from '@/lib/client';
import { Icon } from './Icons';
import { PRIORITY_META, type TaskDTO, type ProjectDTO } from '@/lib/types';
import { formatDueLabel } from '@/lib/date';

export default function BoardView({ project, tasks }: { project: ProjectDTO; tasks: TaskDTO[] }) {
  const refreshTasks = useStore((s) => s.refreshTasks);
  const [dragId, setDragId] = useState<string | null>(null);

  // Columns: each section + an implicit "No section" column.
  const columns = [
    { id: null as string | null, name: 'No section' },
    ...project.sections.map((s) => ({ id: s.id, name: s.name })),
  ];

  const move = async (taskId: string, sectionId: string | null) => {
    await api.patch(`/api/tasks/${taskId}`, { sectionId });
    await refreshTasks();
  };

  const addSection = async () => {
    const name = prompt('Section name');
    if (!name) return;
    await api.post('/api/sections', { projectId: project.id, name });
    // Reload projects to pick up the new section.
    const { projects } = await api.get<{ projects: ProjectDTO[] }>('/api/projects');
    useStore.setState({ projects });
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => (t.sectionId ?? null) === col.id);
        return (
          <div
            key={col.id ?? 'none'}
            className="flex w-72 shrink-0 flex-col rounded-xl bg-surface-2/50 p-2"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragId) move(dragId, col.id);
              setDragId(null);
            }}
          >
            <div className="mb-2 flex items-center justify-between px-1.5 py-1">
              <span className="text-sm font-semibold">{col.name}</span>
              <span className="text-xs text-muted">{colTasks.length}</span>
            </div>
            <div className="space-y-2">
              {colTasks.map((t) => (
                <BoardCard key={t.id} task={t} onDragStart={() => setDragId(t.id)} />
              ))}
              {colTasks.length === 0 && (
                <div className="rounded-lg border border-dashed border-border py-6 text-center text-xs text-muted">
                  Drop tasks here
                </div>
              )}
            </div>
          </div>
        );
      })}
      <button
        className="flex h-10 w-72 shrink-0 items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm text-muted hover:border-accent hover:text-accent"
        onClick={addSection}
      >
        <Icon.Plus width={16} height={16} /> Add section
      </button>
    </div>
  );
}

function BoardCard({ task, onDragStart }: { task: TaskDTO; onDragStart: () => void }) {
  const selectTask = useStore((s) => s.selectTask);
  const toggleComplete = useStore((s) => s.toggleComplete);
  const meta = PRIORITY_META[task.priority];
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="card cursor-grab p-2.5 shadow-sm active:cursor-grabbing"
    >
      <div className="flex items-start gap-2">
        <button
          className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2"
          style={{ borderColor: meta.color, backgroundColor: task.completed ? meta.color : 'transparent' }}
          onClick={() => toggleComplete(task.id)}
          aria-label="Complete"
        >
          {task.completed && <Icon.Check width={10} height={10} className="text-white" />}
        </button>
        <button className="min-w-0 flex-1 text-left" onClick={() => selectTask(task.id)}>
          <p className={`text-sm ${task.completed ? 'text-muted line-through' : ''}`}>{task.title}</p>
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted">
            {task.dueDate && (
              <span className="inline-flex items-center gap-1">
                <Icon.Calendar width={11} height={11} />
                {formatDueLabel(task.dueDate, task.dueTime)}
              </span>
            )}
            {task.labels.map((l) => (
              <span key={l.id} style={{ color: l.color }}>
                @{l.name}
              </span>
            ))}
          </div>
        </button>
      </div>
    </div>
  );
}
