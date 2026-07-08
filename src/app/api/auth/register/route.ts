import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword, setSessionCookie } from '@/lib/auth';
import { handle, json, errorResponse } from '@/lib/api';
import { seedNewUser } from '@/lib/userSetup';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(80),
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(req: Request) {
  return handle(async () => {
    const body = schema.parse(await req.json());
    const email = body.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return errorResponse('An account with that email already exists', 409);

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email,
        password: await hashPassword(body.password),
      },
    });

    await seedNewUser(user.id);
    await setSessionCookie(user.id);

    return json({ id: user.id, name: user.name, email: user.email }, { status: 201 });
  });
}
