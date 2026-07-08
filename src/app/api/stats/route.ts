import { prisma } from '@/lib/prisma';
import { requireUserId } from '@/lib/auth';
import { handle, json } from '@/lib/api';
import { startOfDay, addDays } from '@/lib/date';

// Productivity summary: totals plus completions per day for the last 7 days.
export async function GET() {
  return handle(async () => {
    const userId = await requireUserId();
    const [total, completed, overdue, user] = await Promise.all([
      prisma.task.count({ where: { userId } }),
      prisma.task.count({ where: { userId, completed: true } }),
      prisma.task.count({
        where: { userId, completed: false, dueDate: { lt: startOfDay(new Date()) } },
      }),
      prisma.user.findUnique({ where: { id: userId }, select: { karma: true, streak: true } }),
    ]);

    const since = addDays(startOfDay(new Date()), -6);
    const recent = await prisma.task.findMany({
      where: { userId, completed: true, completedAt: { gte: since } },
      select: { completedAt: true },
    });

    const perDay: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = addDays(startOfDay(new Date()), -i);
      const next = addDays(day, 1);
      const count = recent.filter(
        (t) => t.completedAt && t.completedAt >= day && t.completedAt < next,
      ).length;
      perDay.push({ date: day.toISOString().slice(0, 10), count });
    }

    return json({
      total,
      completed,
      active: total - completed,
      overdue,
      karma: user?.karma ?? 0,
      streak: user?.streak ?? 0,
      perDay,
    });
  });
}

export const dynamic = 'force-dynamic';
