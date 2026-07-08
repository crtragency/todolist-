import { PrismaClient, type Priority } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}

async function main() {
  const email = 'demo@everything.app';
  const password = await bcrypt.hash('demodemo', 10);

  // Reset the demo user for a clean, repeatable seed.
  await prisma.user.deleteMany({ where: { email } });

  const user = await prisma.user.create({
    data: { name: 'Demo', email, password, karma: 120, streak: 4 },
  });

  const inbox = await prisma.project.create({
    data: { userId: user.id, name: 'Inbox', color: '#3b82f6', icon: '📥', isInbox: true, order: 0 },
  });
  const work = await prisma.project.create({
    data: { userId: user.id, name: 'Work', color: '#1971c2', icon: '💼', order: 1, favorite: true, viewType: 'board' },
  });
  const home = await prisma.project.create({
    data: { userId: user.id, name: 'Home', color: '#2f9e44', icon: '🏠', order: 2 },
  });
  const fitness = await prisma.project.create({
    data: { userId: user.id, name: 'Fitness', color: '#e03131', icon: '💪', order: 3 },
  });

  const [toDo, inProgress] = await Promise.all([
    prisma.section.create({ data: { userId: user.id, projectId: work.id, name: 'To do', order: 0 } }),
    prisma.section.create({ data: { userId: user.id, projectId: work.id, name: 'In progress', order: 1 } }),
  ]);

  const labels = await Promise.all(
    [
      { name: 'laptop', color: '#7048e8' },
      { name: 'errand', color: '#f08c00' },
      { name: 'quick', color: '#0d9488' },
      { name: 'deep-work', color: '#1971c2' },
    ].map((l) => prisma.label.create({ data: { userId: user.id, ...l } })),
  );
  const labelByName = Object.fromEntries(labels.map((l) => [l.name, l.id]));

  type Seed = {
    title: string;
    project: string;
    section?: string;
    dueDate?: Date;
    dueTime?: string;
    priority?: Priority;
    recurrence?: string;
    labels?: string[];
    estimatedMin?: number;
    description?: string;
    subtasks?: string[];
  };

  const projMap: Record<string, string> = { Inbox: inbox.id, Work: work.id, Home: home.id, Fitness: fitness.id };
  const sectionMap: Record<string, string> = { 'To do': toDo.id, 'In progress': inProgress.id };

  const seeds: Seed[] = [
    { title: 'Finish quarterly report', project: 'Work', section: 'In progress', dueDate: daysFromNow(0), dueTime: '17:00', priority: 'P1', labels: ['deep-work', 'laptop'], estimatedMin: 90, description: 'Include Q3 metrics and the roadmap slide.', subtasks: ['Pull analytics', 'Draft summary', 'Review with team'] },
    { title: 'Reply to client emails', project: 'Work', section: 'To do', dueDate: daysFromNow(0), priority: 'P2', labels: ['quick'] },
    { title: 'Prepare sprint demo', project: 'Work', section: 'To do', dueDate: daysFromNow(2), priority: 'P2', labels: ['laptop'] },
    { title: 'Standup notes', project: 'Work', section: 'In progress', priority: 'P4', recurrence: 'every weekday', dueDate: daysFromNow(1) },
    { title: 'Buy groceries', project: 'Home', dueDate: daysFromNow(0), priority: 'P3', labels: ['errand'], subtasks: ['Milk', 'Eggs', 'Coffee', 'Vegetables'] },
    { title: 'Water the plants', project: 'Home', dueDate: daysFromNow(0), priority: 'P4', recurrence: 'every 3 days' },
    { title: 'Pay electricity bill', project: 'Home', dueDate: daysFromNow(-1), priority: 'P1', labels: ['errand'] },
    { title: 'Book dentist appointment', project: 'Home', dueDate: daysFromNow(4), priority: 'P3' },
    { title: 'Morning run', project: 'Fitness', dueDate: daysFromNow(0), dueTime: '07:00', priority: 'P2', recurrence: 'every day', estimatedMin: 30 },
    { title: 'Meal prep for the week', project: 'Fitness', dueDate: daysFromNow(1), priority: 'P3' },
    { title: 'Read 20 pages', project: 'Inbox', dueDate: daysFromNow(0), priority: 'P4', recurrence: 'every day' },
    { title: 'Plan weekend trip', project: 'Inbox', dueDate: daysFromNow(6), priority: 'P3' },
    { title: 'Renew gym membership', project: 'Inbox', priority: 'P4' },
  ];

  let order = 0;
  for (const s of seeds) {
    const task = await prisma.task.create({
      data: {
        userId: user.id,
        projectId: projMap[s.project],
        sectionId: s.section ? sectionMap[s.section] : null,
        title: s.title,
        description: s.description ?? '',
        dueDate: s.dueDate ?? null,
        dueTime: s.dueTime ?? null,
        priority: s.priority ?? 'P4',
        recurrence: s.recurrence ?? null,
        estimatedMin: s.estimatedMin ?? null,
        order: order++,
        labels: { create: (s.labels ?? []).map((n) => ({ labelId: labelByName[n] })) },
      },
    });
    if (s.subtasks) {
      let so = 0;
      for (const st of s.subtasks) {
        await prisma.task.create({
          data: {
            userId: user.id,
            projectId: projMap[s.project],
            parentTaskId: task.id,
            title: st,
            priority: 'P4',
            order: so++,
          },
        });
      }
    }
  }

  // A couple of completed tasks over the past days for the dashboard chart.
  for (let i = 1; i <= 5; i++) {
    await prisma.task.create({
      data: {
        userId: user.id,
        projectId: inbox.id,
        title: `Completed task ${i}`,
        priority: 'P3',
        completed: true,
        completedAt: daysFromNow(-(i % 6)),
        order: 100 + i,
      },
    });
  }

  // Saved filters.
  await prisma.filter.createMany({
    data: [
      { userId: user.id, name: 'Priority today', query: 'today & p1', color: '#e03131', favorite: true, order: 0 },
      { userId: user.id, name: 'Deep work', query: '@deep-work', color: '#1971c2', order: 1 },
    ],
  });

  console.log('✔ Seeded demo account: demo@everything.app / demodemo');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
