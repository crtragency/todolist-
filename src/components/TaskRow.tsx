'use client';

import { useStore } from '@/lib/store';
import { Icon } from './Icons';
import { PRIORITY_META, type TaskDTO } from '@/lib/types';
import { formatDueLabel, bucketFor } from '@/lib/date';

export default function TaskRow({ task }: { task: TaskDTO }) {
  const toggleComplete = useStore((s) => s.toggleComplete);
  const selectTask = useStore((s) => s.selectTask);
  const selectedIds = useStore((s) => s.selectedIds);
  const toggleSelect = useStore((s) => s.toggleSelect);
  const projects = useStore((s) => s.projects);
  const view = useStore((s) => s.view);

  const meta = PRIORITY_META[task.priority];
  const bucket = bucketFor(task.dueDate);
  const selected = selectedIds.has(task.id);
  const project = projects.find((p) => p.id === task.projectId);
  const showProject = view.kind !== 'project' && view.kind !== 'inbox' && project && !project.isInbox;

  return (
    <div
      className={`group flex items-start gap-3 border-b border-border px-1 py-2.5 transition-colors hover:bg-surface-2/50 ${
        selected ? 'bg-accent/5' : ''
      }`}
    >
      {/* Multi-select (appears on hover) */}
      <button
        className={`mt-0.5 shrink-0 rounded transition-opacity ${
          selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
        onClick={() => toggleSelect(task.id)}
        title="Select"
        aria-label="Select task"
      >
        <span
          className={`flex h-4 w-4 items-center justify-center rounded border ${
            selected ? 'border-accent bg-accent text-accent-fg' : 'border-muted'
          }`}
        >
          {selected && <Icon.Check width={12} height={12} />}
        </span>
      </button>

      {/* Complete checkbox */}
      <button
        className="task-complete-checkbox mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"
        style={{ borderColor: meta.color, backgroundColor: task.completed ? meta.color : 'transparent' }}
        onClick={() => toggleComplete(task.id)}
        aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {task.completed && <Icon.Check width={12} height={12} className="text-white" />}
      </button>

      {/* Body */}
      <button className="min-w-0 flex-1 text-left" onClick={() => selectTask(task.id)}>
        <div className="flex items-start gap-2">
          <span
            className={`text-sm leading-snug ${task.completed ? 'text-muted line-through' : ''}`}
          >
            {task.title}
          </span>
        </div>

        {task.description && (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted">{task.description}</p>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {task.dueDate && (
            <span
              className={`inline-flex items-center gap-1 ${
                bucket === 'overdue'
                  ? 'text-p1'
                  : bucket === 'today'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-muted'
              }`}
            >
              <Icon.Calendar width={12} height={12} />
              {formatDueLabel(task.dueDate, task.dueTime)}
            </span>
          )}
          {task.recurrence && (
            <span className="inline-flex items-center gap-1 text-muted">
              <Icon.Repeat width={12} height={12} />
            </span>
          )}
          {task.subtaskCount ? (
            <span className="inline-flex items-center gap-1 text-muted">
              <Icon.CheckCircle width={12} height={12} />
              {task.completedSubtaskCount}/{task.subtaskCount}
            </span>
          ) : null}
          {task.estimatedMin ? (
            <span className="inline-flex items-center gap-1 text-muted">
              <Icon.Clock width={12} height={12} />
              {task.estimatedMin}m
            </span>
          ) : null}
          {task.labels.map((l) => (
            <span
              key={l.id}
              className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5"
              style={{ backgroundColor: `${l.color}1a`, color: l.color }}
            >
              <Icon.Tag width={10} height={10} />
              {l.name}
            </span>
          ))}
          {showProject && (
            <span className="inline-flex items-center gap-1 text-muted">
              <span style={{ color: project!.color }}>{project!.icon}</span>
              {project!.name}
            </span>
          )}
        </div>
      </button>
    </div>
  );
}
