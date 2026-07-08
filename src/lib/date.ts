// Lightweight date helpers. We treat dueDate as date-only (local midnight)
// and carry the time separately in dueTime ("HH:mm").

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function toISODate(d: Date): string {
  return startOfDay(d).toISOString();
}

/** Human label like "Today", "Tomorrow", "Mon", or "Jul 12". */
export function formatDueLabel(iso: string | null, time?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const today = startOfDay(new Date());
  const target = startOfDay(d);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  let base: string;
  if (diff === 0) base = 'Today';
  else if (diff === 1) base = 'Tomorrow';
  else if (diff === -1) base = 'Yesterday';
  else if (diff > 1 && diff < 7) base = target.toLocaleDateString(undefined, { weekday: 'short' });
  else if (diff < 0) base = target.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  else {
    const sameYear = target.getFullYear() === today.getFullYear();
    base = target.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: sameYear ? undefined : 'numeric',
    });
  }
  return time ? `${base} ${formatTime(time)}` : base;
}

export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12}${ampm}` : `${h12}:${String(m).padStart(2, '0')}${ampm}`;
}

export type DueBucket = 'overdue' | 'today' | 'upcoming' | 'none';

export function bucketFor(iso: string | null): DueBucket {
  if (!iso) return 'none';
  const today = startOfDay(new Date());
  const target = startOfDay(new Date(iso));
  if (target.getTime() < today.getTime()) return 'overdue';
  if (target.getTime() === today.getTime()) return 'today';
  return 'upcoming';
}
