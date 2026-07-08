import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUserId } from '@/lib/auth';
import { handle, json } from '@/lib/api';

export async function GET() {
  return handle(async () => {
    const userId = await requireUserId();
    const filters = await prisma.filter.findMany({ where: { userId }, orderBy: { order: 'asc' } });
    return json({ filters });
  });
}

const schema = z.object({
  name: z.string().min(1).max(80),
  query: z.string().min(1).max(300),
  color: z.string().optional(),
  favorite: z.boolean().optional(),
});

export async function POST(req: Request) {
  return handle(async () => {
    const userId = await requireUserId();
    const body = schema.parse(await req.json());
    const count = await prisma.filter.count({ where: { userId } });
    const filter = await prisma.filter.create({
      data: {
        userId,
        name: body.name,
        query: body.query,
        color: body.color ?? '#808080',
        favorite: body.favorite ?? false,
        order: count,
      },
    });
    return json({ filter }, { status: 201 });
  });
}

export const dynamic = 'force-dynamic';
