import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUserId } from '@/lib/auth';
import { handle, json, errorResponse } from '@/lib/api';
import { serializeTask, taskInclude } from '@/lib/serialize';
import { nextOccurrence } from '@/lib/recurrence';

const patchSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  projectId: z.string().optional(),
  sectionId: z.string().nullish(),
  dueDate: z.string().datetime().nullish(),
  dueTime: z.string().regex(/^\d{2}:\d{2}$/).nullish(),
  deadline: z.string().datetime().nullish(),
  priority: z.enum(['P1', 'P2', 'P3', 'P4']).optional(),
  recurrence: z.string().nullish(),
  estimatedMin: z.number().int().positive().nullish(),
  completed: z.boolean().optional(),
  order: z.number().optional(),
  labelNames: z.array(z.string()).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const userId = await requireUserId();
    const existing = await prisma.task.findFirst({ where: { id: params.id, userId } });
    if (!existing) return errorResponse('Not found', 404);
    const body = patchSchema.parse(await req.json());

    // Recurring task completed → advance the due date instead of completing.
    if (body.completed === true && existing.recurrence && existing.dueDate) {
      const next = nextOccurrence(existing.recurrence, existing.dueDate);
      if (next) {
        const task = await prisma.task.update({
          where: { id: params.id },
          data: { dueDate: next, completed: false },
          include: taskInclude,
        });
        // Award karma for completing an occurrence.
        await prisma.user.update({ where: { id: userId }, data: { karma: { increment: 5 } } });
        return json({ task: serializeTask(task), recurred: true });
      }
    }

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.projectId !== undefined) data.projectId = body.projectId;
    if (body.sectionId !== undefined) data.sectionId = body.sectionId;
    if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.dueTime !== undefined) data.dueTime = body.dueTime;
    if (body.deadline !== undefined) data.deadline = body.deadline ? new Date(body.deadline) : null;
    if (body.priority !== undefined) data.priority = body.priority;
    if (body.recurrence !== undefined) data.recurrence = body.recurrence;
    if (body.estimatedMin !== undefined) data.estimatedMin = body.estimatedMin;
    if (body.order !== undefined) data.order = body.order;
    if (body.completed !== undefined) {
      data.completed = body.completed;
      data.completedAt = body.completed ? new Date() : null;
    }

    // Replace labels if provided.
    if (body.labelNames !== undefined) {
      const labelIds: string[] = [];
      for (const raw of body.labelNames) {
        const name = raw.trim();
        if (!name) continue;
        const label = await prisma.label.upsert({
          where: { userId_name: { userId, name } },
          create: { userId, name },
          update: {},
        });
        labelIds.push(label.id);
      }
      await prisma.taskLabel.deleteMany({ where: { taskId: params.id } });
      data.labels = { create: labelIds.map((labelId) => ({ labelId })) };
    }

    const task = await prisma.task.update({
      where: { id: params.id },
      data,
      include: taskInclude,
    });

    if (body.completed === true) {
      await prisma.user.update({ where: { id: userId }, data: { karma: { increment: 5 } } });
    }

    return json({ task: serializeTask(task) });
  });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const userId = await requireUserId();
    const existing = await prisma.task.findFirst({ where: { id: params.id, userId } });
    if (!existing) return errorResponse('Not found', 404);
    await prisma.task.delete({ where: { id: params.id } });
    return json({ ok: true });
  });
}

// GET a single task with its subtasks (for the detail panel).
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const userId = await requireUserId();
    const task = await prisma.task.findFirst({
      where: { id: params.id, userId },
      include: { ...taskInclude, subtasks: { include: taskInclude, orderBy: { order: 'asc' } } },
    });
    if (!task) return errorResponse('Not found', 404);
    return json({
      task: serializeTask(task),
      subtasks: task.subtasks.map(serializeTask),
    });
  });
}
