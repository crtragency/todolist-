import type { Prisma } from '@prisma/client';
import type { TaskDTO, ProjectDTO, LabelDTO } from './types';

type TaskWithRelations = Prisma.TaskGetPayload<{
  include: { labels: { include: { label: true } }; subtasks: { select: { completed: true } } };
}>;

export function serializeTask(t: TaskWithRelations): TaskDTO {
  return {
    id: t.id,
    projectId: t.projectId,
    sectionId: t.sectionId,
    parentTaskId: t.parentTaskId,
    title: t.title,
    description: t.description,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    dueTime: t.dueTime,
    deadline: t.deadline ? t.deadline.toISOString() : null,
    priority: t.priority,
    recurrence: t.recurrence,
    estimatedMin: t.estimatedMin,
    completed: t.completed,
    completedAt: t.completedAt ? t.completedAt.toISOString() : null,
    order: t.order,
    createdAt: t.createdAt.toISOString(),
    labels: t.labels.map((tl) => ({
      id: tl.label.id,
      name: tl.label.name,
      color: tl.label.color,
    })),
    subtaskCount: t.subtasks?.length ?? 0,
    completedSubtaskCount: t.subtasks?.filter((s) => s.completed).length ?? 0,
  };
}

export const taskInclude = {
  labels: { include: { label: true } },
  subtasks: { select: { completed: true } },
} satisfies Prisma.TaskInclude;

type ProjectWithSections = Prisma.ProjectGetPayload<{ include: { sections: true } }> & {
  _count?: { tasks: number };
};

export function serializeProject(p: ProjectWithSections): ProjectDTO {
  return {
    id: p.id,
    name: p.name,
    color: p.color,
    icon: p.icon,
    isInbox: p.isInbox,
    favorite: p.favorite,
    archived: p.archived,
    viewType: p.viewType,
    order: p.order,
    sections: p.sections
      .sort((a, b) => a.order - b.order)
      .map((s) => ({ id: s.id, projectId: s.projectId, name: s.name, order: s.order })),
    taskCount: p._count?.tasks,
  };
}

export function serializeLabel(l: { id: string; name: string; color: string }): LabelDTO {
  return { id: l.id, name: l.name, color: l.color };
}
