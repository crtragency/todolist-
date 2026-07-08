import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUserId } from '@/lib/auth';
import { handle, json, errorResponse } from '@/lib/api';

const patchSchema = z.object({ name: z.string().min(1).max(120).optional(), order: z.number().optional() });

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const userId = await requireUserId();
    const section = await prisma.section.findFirst({ where: { id: params.id, userId } });
    if (!section) return errorResponse('Not found', 404);
    const data = patchSchema.parse(await req.json());
    const updated = await prisma.section.update({ where: { id: params.id }, data });
    return json({ section: updated });
  });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const userId = await requireUserId();
    const section = await prisma.section.findFirst({ where: { id: params.id, userId } });
    if (!section) return errorResponse('Not found', 404);
    await prisma.section.delete({ where: { id: params.id } });
    return json({ ok: true });
  });
}
