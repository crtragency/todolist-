import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUserId } from '@/lib/auth';
import { handle, json, errorResponse } from '@/lib/api';

const patchSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  query: z.string().min(1).max(300).optional(),
  color: z.string().optional(),
  favorite: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const userId = await requireUserId();
    const filter = await prisma.filter.findFirst({ where: { id: params.id, userId } });
    if (!filter) return errorResponse('Not found', 404);
    const data = patchSchema.parse(await req.json());
    const updated = await prisma.filter.update({ where: { id: params.id }, data });
    return json({ filter: updated });
  });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const userId = await requireUserId();
    const filter = await prisma.filter.findFirst({ where: { id: params.id, userId } });
    if (!filter) return errorResponse('Not found', 404);
    await prisma.filter.delete({ where: { id: params.id } });
    return json({ ok: true });
  });
}
