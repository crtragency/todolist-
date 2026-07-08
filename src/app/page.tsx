import { redirect } from 'next/navigation';
import { getUserId } from '@/lib/auth';
import AppShell from '@/components/AppShell';

export default async function Home() {
  const userId = await getUserId();
  if (!userId) redirect('/login');
  return <AppShell />;
}
