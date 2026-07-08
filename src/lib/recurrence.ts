// Given a recurrence rule string and the current due date, compute the next
// due date. Supports the common cases; unknown rules return null (no repeat).

import { addDays } from './date';

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export function nextOccurrence(rule: string, from: Date): Date | null {
  const r = rule.toLowerCase().replace(/^every!?\s*/, '').trim();

  // "N days/weeks/months/years"
  const nMatch = r.match(/^(\d+)\s+(day|days|week|weeks|month|months|year|years)$/);
  if (nMatch) {
    const n = parseInt(nMatch[1], 10);
    const unit = nMatch[2];
    if (unit.startsWith('day')) return addDays(from, n);
    if (unit.startsWith('week')) return addDays(from, n * 7);
    if (unit.startsWith('month')) {
      const d = new Date(from);
      d.setMonth(d.getMonth() + n);
      return d;
    }
    if (unit.startsWith('year')) {
      const d = new Date(from);
      d.setFullYear(d.getFullYear() + n);
      return d;
    }
  }

  if (/^days?$/.test(r) || r === 'daily') return addDays(from, 1);
  if (/^weeks?$/.test(r) || r === 'weekly') return addDays(from, 7);
  if (/^months?$/.test(r) || r === 'monthly') {
    const d = new Date(from);
    d.setMonth(d.getMonth() + 1);
    return d;
  }
  if (/^years?$/.test(r) || r === 'yearly') {
    const d = new Date(from);
    d.setFullYear(d.getFullYear() + 1);
    return d;
  }

  if (r === 'weekday' || r === 'weekdays') {
    let d = addDays(from, 1);
    while (d.getDay() === 0 || d.getDay() === 6) d = addDays(d, 1);
    return d;
  }

  // Named weekday → next occurrence of that weekday.
  const wd = WEEKDAYS.findIndex((w) => r === w || r.startsWith(w.slice(0, 3)));
  if (wd >= 0) {
    const diff = (wd - from.getDay() + 7) % 7 || 7;
    return addDays(from, diff);
  }

  return null;
}
