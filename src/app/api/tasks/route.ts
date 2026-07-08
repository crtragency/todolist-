import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireUserId } from '@/lib/auth';
import { handle, json } from '@/lib/api';
import { serializeTask, taskInclude } from '@/lib/serialize';
import { startOfDay, addDays } from '@/lib/date';

// GET /api/tasks?view=today|upcoming|overdue|completed|inbox&projectId=&labelId=&search=
export async function GET(req: Request) {
  return handle(async () => {
    const userId = await requireUserId();
    const url = new URL(req.url);
    const view = url.searchParams.get('view');
    const projectId = url.searchParams.get('projectId');
    const labelId = url.searchParams.get('labelId');
    const search = url.searchParams.get('search');
    const priority = url.searchParams.get('priority');

    const where: Prisma.TaskWhereInput = { userId };

    if (view === 'completed') where.completed = true;
    else where.completed = false;

    const today = startOfDay(new Date());
    if (view === 'today') where.dueDate = { lte: today };
    else if (view === 'overdue') where.dueDate = { lt: today };
    else if (view === 'upcoming') where.dueDate = { gte: today, lt: addDays(today, 30) };

    if (projectId) where.projectId = projectId;
    if (labelId) where.labels = { some: { labelId } };
    if (priority) where.priority = priority as Prisma.EnumPriorityFilter['equals'];
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy: [{ completed: 'asc' }, { order: 'asc' }, { createdAt: 'asc' }],
    });

    return json({ tasks: tasks.map(serializeTask) });
  });
}

const createSchema = z.object({
  title: z.string().min(1, 'Title required').max(500),
  projectId: z.string().optional(),
  sectionId: z.string().nullish(),
  parentTaskId: z.string().nullish(),
  description: z.string().optional(),
  dueDate: z.string().datetime().nullish(),
  dueTime: z.string().regex(/^\d{2}:\d{2}$/).nullish(),
  deadline: z.string().datetime().nullish(),
  priority: z.enum(['P1', 'P2', 'P3', 'P4']).optional(),
  recurrence: z.string().nullish(),
  estimatedMin: z.number().int().positive().nullish(),
  labelNames: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  return handle(async () => {
    const userId = await requireUserId();
    const body = createSchema.parse(await req.json());

    // Resolve target project: explicit, or the user's Inbox.
    let projectId = body.projectId;
    if (!projectId) {
      const inbox = await prisma.project.findFirst({ where: { userId, isInbox: true } });
      projectId = inbox?.id;
    }
    if (!projectId) throw Object.assign(new Error('No project available'), { status: 400 });

    // Resolve / create labels by name.
    const labelIds: string[] = [];
    if (body.labelNames?.length) {
      for (const rawName of body.labelNames) {
        const name = rawName.trim();
        if (!name) continue;
        const label = await prisma.label.upsert({
          where: { userId_name: { userId, name } },
          create: { userId, name },
          update: {},
        });
        labelIds.push(label.id);
      }
    }

    const count = await prisma.task.count({ where: { userId, projectId } });

    const task = await prisma.task.create({
      data: {
        userId,
        projectId,
        sectionId: body.sectionId ?? null,
        parentTaskId: body.parentTaskId ?? null,
        title: body.title,
        description: body.description ?? '',
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        dueTime: body.dueTime ?? null,
        deadline: body.deadline ? new Date(body.deadline) : null,
        priority: body.priority ?? 'P4',
        recurrence: body.recurrence ?? null,
        estimatedMin: body.estimatedMin ?? null,
        order: count,
        labels: { create: labelIds.map((labelId) => ({ labelId })) },
      },
      include: taskInclude,
    });

    return json({ task: serializeTask(task) }, { status: 201 });
  });
}

export const dynamic = 'force-dynamic';
