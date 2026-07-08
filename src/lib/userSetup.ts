import { prisma } from './prisma';

// Give every new user an Inbox project plus a couple of starter labels
// so the app is never empty on first login.
export async function seedNewUser(userId: string): Promise<void> {
  await prisma.project.create({
    data: { userId, name: 'Inbox', color: '#3b82f6', icon: '📥', isInbox: true, order: 0 },
  });
  await prisma.label.createMany({
    data: [
      { userId, name: 'home', color: '#f59e0b' },
      { userId, name: 'work', color: '#3b82f6' },
    ],
  });
}
