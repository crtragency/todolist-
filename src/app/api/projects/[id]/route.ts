import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUserId } from '@/lib/auth';
import { handle, json, errorResponse } from '@/lib/api';
import { serializeProject } from '@/lib/serialize';

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  favorite: z.boolean().optional(),
  archived: z.boolean().optional(),
  viewType: z.enum(['list', 'board']).optional(),
  order: z.number().optional(),
});

async function ownProject(userId: string, id: string) {
  const project = await prisma.project.findFirst({ where: { id, userId } });
  return project;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const userId = await requireUserId();
    if (!(await ownProject(userId, params.id))) return errorResponse('Not found', 404);
    const data = patchSchema.parse(await req.json());
    const project = await prisma.project.update({
      where: { id: params.id },
      data,
      include: { sections: true },
    });
    return json({ project: serializeProject(project) });
  });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const userId = await requireUserId();
    const project = await ownProject(userId, params.id);
    if (!project) return errorResponse('Not found', 404);
    if (project.isInbox) return errorResponse('The Inbox cannot be deleted', 400);
    await prisma.project.delete({ where: { id: params.id } });
    return json({ ok: true });
  });
}
