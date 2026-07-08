import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/auth';
import { handle, json } from '@/lib/api';
import type { UserDTO } from '@/lib/types';

export async function GET() {
  return handle(async () => {
    const userId = await getUserId();
    if (!userId) return json({ user: null });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return json({ user: null });
    const dto: UserDTO = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      karma: user.karma,
      streak: user.streak,
      settings: (user.settings as Record<string, unknown>) ?? {},
    };
    return json({ user: dto });
  });
}

export async function PATCH(req: Request) {
  return handle(async () => {
    const userId = await getUserId();
    if (!userId) return json({ user: null }, { status: 401 });
    const body = (await req.json()) as { name?: string; settings?: Record<string, unknown> };
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(body.name ? { name: body.name } : {}),
        ...(body.settings ? { settings: body.settings as Prisma.InputJsonValue } : {}),
      },
    });
    return json({ user: { id: user.id, name: user.name, settings: user.settings } });
  });
}

export const dynamic = 'force-dynamic';
