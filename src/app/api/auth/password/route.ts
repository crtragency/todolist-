import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUserId, verifyPassword, hashPassword } from '@/lib/auth';
import { handle, json, errorResponse } from '@/lib/api';

const schema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export async function PATCH(req: Request) {
  return handle(async () => {
    const userId = await requireUserId();
    const body = schema.parse(await req.json());

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return errorResponse('Not found', 404);
    if (!(await verifyPassword(body.currentPassword, user.password))) {
      return errorResponse('Current password is incorrect', 403);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { password: await hashPassword(body.newPassword) },
    });
    return json({ ok: true });
  });
}

export const dynamic = 'force-dynamic';
