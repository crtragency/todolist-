'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { api } from '@/lib/client';
import { Icon } from './Icons';
import QuickAdd from './QuickAdd';
import { PRIORITY_META, type TaskDTO, type Priority } from '@/lib/types';
import { formatDueLabel } from '@/lib/date';
import { addDays, startOfDay } from '@/lib/date';

export default function TaskDetail() {
  const selectedTaskId = useStore((s) => s.selectedTaskId);
  const selectTask = useStore((s) => s.selectTask);
  const updateTask = useStore((s) => s.updateTask);
  const deleteTask = useStore((s) => s.deleteTask);
  const toggleComplete = useStore((s) => s.toggleComplete);
  const projects = useStore((s) => s.projects);
  const storeTasks = useStore((s) => s.tasks);

  const [task, setTask] = useState<TaskDTO | null>(null);
  const [subtasks, setSubtasks] = useState<TaskDTO[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [addingSub, setAddingSub] = useState(false);

  // Load full task + subtasks when selection changes.
  useEffect(() => {
    if (!selectedTaskId) return;
    let active = true;
    api
      .get<{ task: TaskDTO; subtasks: TaskDTO[] }>(`/api/tasks/${selectedTaskId}`)
      .then((data) => {
        if (!active) return;
        setTask(data.task);
        setSubtasks(data.subtasks);
        setTitle(data.task.title);
        setDescription(data.task.description);
      })
      .catch(() => selectTask(null));
    return () => {
      active = false;
    };
  }, [selectedTaskId, selectTask, storeTasks]);

  if (!selectedTaskId || !task) return null;

  const meta = PRIORITY_META[task.priority];
  const project = projects.find((p) => p.id === task.projectId);

  const patch = async (p: Partial<TaskDTO> & { labelNames?: string[] }) => {
    setTask((t) => (t ? { ...t, ...p } : t));
    await updateTask(task.id, p);
  };

  const saveTitle = () => {
    if (title.trim() && title !== task.title) patch({ title: title.trim() });
  };
  const saveDescription = () => {
    if (description !== task.description) patch({ description });
  };

  const reloadSubtasks = async () => {
    const data = await api.get<{ subtasks: TaskDTO[] }>(`/api/tasks/${task.id}`);
    setSubtasks(data.subtasks);
  };

  const setDue = (date: Date | null) => {
    patch({ dueDate: date ? startOfDay(date).toISOString() : null });
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => selectTask(null)} />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-surface shadow-xl animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted">
            <span style={{ color: project?.color }}>{project?.icon}</span>
            {project?.name}
          </div>
          <div className="flex items-center gap-1">
            <button
              className="btn-ghost p-2 text-muted hover:text-p1"
              onClick={() => {
                deleteTask(task.id);
                selectTask(null);
              }}
              title="Delete task"
            >
              <Icon.Trash />
            </button>
            <button className="btn-ghost p-2" onClick={() => selectTask(null)} title="Close">
              <Icon.Close />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
          {/* Title + complete */}
          <div className="flex items-start gap-3">
            <button
              className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"
              style={{ borderColor: meta.color, backgroundColor: task.completed ? meta.color : 'transparent' }}
              onClick={() => {
                toggleComplete(task.id);
                selectTask(null);
              }}
              aria-label="Complete task"
            >
              {task.completed && <Icon.Check width={12} height={12} className="text-white" />}
            </button>
            <textarea
              className="flex-1 resize-none bg-transparent text-lg font-semibold outline-none"
              value={title}
              rows={Math.max(1, Math.ceil(title.length / 32))}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
            />
          </div>

          {/* Description */}
          <textarea
            className="input min-h-[80px] resize-y"
            placeholder="Add notes…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={saveDescription}
          />

          {/* Properties */}
          <div className="space-y-3">
            <Property label="Due date" icon={<Icon.Calendar width={16} height={16} />}>
              <div className="flex flex-wrap items-center gap-1.5">
                <QuickDate label="Today" onClick={() => setDue(new Date())} />
                <QuickDate label="Tomorrow" onClick={() => setDue(addDays(new Date(), 1))} />
                <QuickDate label="Next week" onClick={() => setDue(addDays(new Date(), 7))} />
                <input
                  type="date"
                  className="rounded-md border border-border bg-surface px-2 py-1 text-xs"
                  value={task.dueDate ? task.dueDate.slice(0, 10) : ''}
                  onChange={(e) => setDue(e.target.value ? new Date(e.target.value) : null)}
                />
                {task.dueDate && (
                  <button className="text-xs text-muted hover:text-p1" onClick={() => setDue(null)}>
                    Clear
                  </button>
                )}
              </div>
            </Property>

            <Property label="Priority" icon={<Icon.Flag width={16} height={16} />}>
              <div className="flex gap-1.5">
                {(['P1', 'P2', 'P3', 'P4'] as Priority[]).map((p) => (
                  <button
                    key={p}
                    className={`rounded-md border px-2 py-1 text-xs font-medium ${
                      task.priority === p ? 'border-current' : 'border-border text-muted'
                    }`}
                    style={task.priority === p ? { color: PRIORITY_META[p].color } : undefined}
                    onClick={() => patch({ priority: p })}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </Property>

            <Property label="Repeat" icon={<Icon.Repeat width={16} height={16} />}>
              <input
                className="rounded-md border border-border bg-surface px-2 py-1 text-xs"
                placeholder="e.g. every week"
                defaultValue={task.recurrence ?? ''}
                onBlur={(e) => patch({ recurrence: e.target.value.trim() || null })}
              />
            </Property>

            <Property label="Estimate" icon={<Icon.Clock width={16} height={16} />}>
              <input
                type="number"
                min={0}
                className="w-20 rounded-md border border-border bg-surface px-2 py-1 text-xs"
                placeholder="min"
                defaultValue={task.estimatedMin ?? ''}
                onBlur={(e) =>
                  patch({ estimatedMin: e.target.value ? parseInt(e.target.value, 10) : null })
                }
              />
            </Property>

            <Property label="Labels" icon={<Icon.Tag width={16} height={16} />}>
              <input
                className="w-full rounded-md border border-border bg-surface px-2 py-1 text-xs"
                placeholder="comma,separated,labels"
                defaultValue={task.labels.map((l) => l.name).join(', ')}
                onBlur={(e) =>
                  patch({
                    labelNames: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
            </Property>

            <Property label="Move to" icon={<Icon.Hash width={16} height={16} />}>
              <select
                className="rounded-md border border-border bg-surface px-2 py-1 text-xs"
                value={task.projectId}
                onChange={(e) => patch({ projectId: e.target.value })}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.icon} {p.name}
                  </option>
                ))}
              </select>
            </Property>
          </div>

          {/* Subtasks */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-semibold">
                Subtasks{' '}
                {subtasks.length > 0 && (
                  <span className="text-xs font-normal text-muted">
                    {subtasks.filter((s) => s.completed).length}/{subtasks.length}
                  </span>
                )}
              </h4>
              <button className="text-xs text-accent" onClick={() => setAddingSub((v) => !v)}>
                + Add subtask
              </button>
            </div>

            {addingSub && (
              <QuickAdd
                parentTaskId={task.id}
                defaultProjectId={task.projectId}
                autoFocus
                placeholder="Subtask…"
                onDone={() => {
                  setAddingSub(false);
                  reloadSubtasks();
                }}
              />
            )}

            <div className="space-y-1">
              {subtasks.map((st) => (
                <div key={st.id} className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-surface-2">
                  <button
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2"
                    style={{
                      borderColor: PRIORITY_META[st.priority].color,
                      backgroundColor: st.completed ? PRIORITY_META[st.priority].color : 'transparent',
                    }}
                    onClick={async () => {
                      await api.patch(`/api/tasks/${st.id}`, { completed: !st.completed });
                      reloadSubtasks();
                    }}
                    aria-label="Complete subtask"
                  >
                    {st.completed && <Icon.Check width={10} height={10} className="text-white" />}
                  </button>
                  <span className={`flex-1 text-sm ${st.completed ? 'text-muted line-through' : ''}`}>
                    {st.title}
                  </span>
                  <button
                    className="text-muted opacity-0 hover:text-p1 group-hover:opacity-100"
                    onClick={async () => {
                      await api.del(`/api/tasks/${st.id}`);
                      reloadSubtasks();
                    }}
                  >
                    <Icon.Close width={14} height={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {task.dueDate && (
            <p className="text-xs text-muted">
              Scheduled for {formatDueLabel(task.dueDate, task.dueTime)}
            </p>
          )}
        </div>
      </aside>
    </>
  );
}

function Property({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex w-24 shrink-0 items-center gap-2 pt-1 text-xs font-medium text-muted">
        {icon}
        {label}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function QuickDate({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      className="rounded-md border border-border px-2 py-1 text-xs hover:border-accent hover:text-accent"
      onClick={onClick}
    >
      {label}
    </button>
  );
}
