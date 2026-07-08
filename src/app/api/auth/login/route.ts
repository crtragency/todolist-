import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyPassword, setSessionCookie } from '@/lib/auth';
import { handle, json, errorResponse } from '@/lib/api';

const schema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
});

export async function POST(req: Request) {
  return handle(async () => {
    const body = schema.parse(await req.json());
    const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (!user || !(await verifyPassword(body.password, user.password))) {
      return errorResponse('Invalid email or password', 401);
    }
    await setSessionCookie(user.id);
    return json({ id: user.id, name: user.name, email: user.email });
  });
}
