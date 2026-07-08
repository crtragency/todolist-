import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUserId } from '@/lib/auth';
import { handle, json, errorResponse } from '@/lib/api';
import { serializeLabel } from '@/lib/serialize';

const patchSchema = z.object({ name: z.string().min(1).max(60).optional(), color: z.string().optional() });

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const userId = await requireUserId();
    const label = await prisma.label.findFirst({ where: { id: params.id, userId } });
    if (!label) return errorResponse('Not found', 404);
    const data = patchSchema.parse(await req.json());
    const updated = await prisma.label.update({ where: { id: params.id }, data });
    return json({ label: serializeLabel(updated) });
  });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const userId = await requireUserId();
    const label = await prisma.label.findFirst({ where: { id: params.id, userId } });
    if (!label) return errorResponse('Not found', 404);
    await prisma.label.delete({ where: { id: params.id } });
    return json({ ok: true });
  });
}
