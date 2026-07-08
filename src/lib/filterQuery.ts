// Evaluates saved-filter query strings against tasks, client-side.
// Supported tokens, combined with "&" (AND) and "|" (OR):
//   today, overdue, upcoming, "no date", "no due date"
//   p1..p4
//   @label            (label name)
//   #project          (project name)
//   search: free text (anything else matches title/description)
// Example: "today & p1 & @work"

import type { TaskDTO } from './types';
import { bucketFor } from './date';

interface EvalContext {
  projectNameById: Map<string, string>;
}

function matchToken(token: string, task: TaskDTO, ctx: EvalContext): boolean {
  const t = token.trim().toLowerCase();
  if (!t) return true;

  if (t === 'today') return bucketFor(task.dueDate) === 'today';
  if (t === 'overdue') return bucketFor(task.dueDate) === 'overdue';
  if (t === 'upcoming') return bucketFor(task.dueDate) === 'upcoming';
  if (t === 'no date' || t === 'no due date') return !task.dueDate;
  if (/^p[1-4]$/.test(t)) return task.priority.toLowerCase() === t;

  if (t.startsWith('@')) {
    const name = t.slice(1);
    return task.labels.some((l) => l.name.toLowerCase() === name);
  }
  if (t.startsWith('#')) {
    const name = t.slice(1);
    return (ctx.projectNameById.get(task.projectId)?.toLowerCase() ?? '') === name;
  }
  // Free text.
  return (
    task.title.toLowerCase().includes(t) || task.description.toLowerCase().includes(t)
  );
}

export function evaluateFilter(query: string, task: TaskDTO, ctx: EvalContext): boolean {
  // OR has lower precedence than AND.
  const orGroups = query.split('|');
  return orGroups.some((group) =>
    group
      .split('&')
      .every((tok) => matchToken(tok, task, ctx)),
  );
}
