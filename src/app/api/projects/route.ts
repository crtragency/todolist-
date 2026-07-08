import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUserId } from '@/lib/auth';
import { handle, json } from '@/lib/api';
import { serializeProject } from '@/lib/serialize';

export async function GET() {
  return handle(async () => {
    const userId = await requireUserId();
    const projects = await prisma.project.findMany({
      where: { userId, archived: false },
      include: { sections: true, _count: { select: { tasks: { where: { completed: false } } } } },
      orderBy: [{ isInbox: 'desc' }, { order: 'asc' }],
    });
    return json({ projects: projects.map(serializeProject) });
  });
}

const createSchema = z.object({
  name: z.string().min(1).max(120),
  color: z.string().optional(),
  icon: z.string().optional(),
  favorite: z.boolean().optional(),
  viewType: z.enum(['list', 'board']).optional(),
});

export async function POST(req: Request) {
  return handle(async () => {
    const userId = await requireUserId();
    const body = createSchema.parse(await req.json());
    const count = await prisma.project.count({ where: { userId } });
    const project = await prisma.project.create({
      data: {
        userId,
        name: body.name,
        color: body.color ?? '#808080',
        icon: body.icon ?? '#',
        favorite: body.favorite ?? false,
        viewType: body.viewType ?? 'list',
        order: count,
      },
      include: { sections: true },
    });
    return json({ project: serializeProject(project) }, { status: 201 });
  });
}

export const dynamic = 'force-dynamic';
