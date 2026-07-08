import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUserId } from '@/lib/auth';
import { handle, json } from '@/lib/api';
import { serializeLabel } from '@/lib/serialize';

export async function GET() {
  return handle(async () => {
    const userId = await requireUserId();
    const labels = await prisma.label.findMany({ where: { userId }, orderBy: { name: 'asc' } });
    return json({ labels: labels.map(serializeLabel) });
  });
}

const schema = z.object({ name: z.string().min(1).max(60), color: z.string().optional() });

export async function POST(req: Request) {
  return handle(async () => {
    const userId = await requireUserId();
    const body = schema.parse(await req.json());
    const label = await prisma.label.upsert({
      where: { userId_name: { userId, name: body.name.trim() } },
      create: { userId, name: body.name.trim(), color: body.color ?? '#808080' },
      update: { color: body.color ?? undefined },
    });
    return json({ label: serializeLabel(label) }, { status: 201 });
  });
}

export const dynamic = 'force-dynamic';
