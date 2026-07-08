import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUserId } from '@/lib/auth';
import { handle, json, errorResponse } from '@/lib/api';

const schema = z.object({
  projectId: z.string(),
  name: z.string().min(1).max(120),
});

export async function POST(req: Request) {
  return handle(async () => {
    const userId = await requireUserId();
    const body = schema.parse(await req.json());
    const project = await prisma.project.findFirst({ where: { id: body.projectId, userId } });
    if (!project) return errorResponse('Project not found', 404);
    const count = await prisma.section.count({ where: { projectId: body.projectId } });
    const section = await prisma.section.create({
      data: { userId, projectId: body.projectId, name: body.name, order: count },
    });
    return json({ section }, { status: 201 });
  });
}
