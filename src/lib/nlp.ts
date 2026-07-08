// Natural-language quick-add parser.
// Parses input like:
//   "Finish report tomorrow at 5pm #Work @laptop p1 every Monday"
// into structured fields, and returns match ranges so the UI can highlight tokens.

import { addDays, startOfDay } from './date';
import type { Priority } from './types';

export interface ParsedQuickAdd {
  title: string;
  projectName: string | null;
  labelNames: string[];
  priority: Priority | null;
  dueDate: string | null; // ISO
  dueTime: string | null; // "HH:mm"
  recurrence: string | null;
  /** Token strings (with their prefix) that were consumed from the input. */
  tokens: { text: string; type: 'project' | 'label' | 'priority' | 'date' | 'time' | 'recurrence' }[];
}

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const WEEKDAY_ABBR = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function nextWeekday(target: number, from = new Date()): Date {
  const base = startOfDay(from);
  const diff = (target - base.getDay() + 7) % 7 || 7; // always in the future
  return addDays(base, diff);
}

function parseClock(raw: string): string | null {
  // Accepts "5pm", "5:30pm", "17:00", "9am", "noon", "midnight".
  const lower = raw.toLowerCase().trim();
  if (lower === 'noon') return '12:00';
  if (lower === 'midnight') return '00:00';
  const m = lower.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const ap = m[3];
  if (h > 23 || min > 59) return null;
  if (ap === 'pm' && h < 12) h += 12;
  if (ap === 'am' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

export function parseQuickAdd(input: string, now = new Date()): ParsedQuickAdd {
  const result: ParsedQuickAdd = {
    title: '',
    projectName: null,
    labelNames: [],
    priority: null,
    dueDate: null,
    dueTime: null,
    recurrence: null,
    tokens: [],
  };

  let text = ` ${input} `;

  const consume = (
    re: RegExp,
    type: ParsedQuickAdd['tokens'][number]['type'],
    onMatch: (m: RegExpMatchArray) => boolean,
  ) => {
    let m: RegExpMatchArray | null;
    // Reset lastIndex handling by rebuilding regex per iteration.
    const global = new RegExp(re.source, 'gi');
    while ((m = global.exec(text)) !== null) {
      const idx = m.index ?? 0;
      if (onMatch(m)) {
        result.tokens.push({ text: m[0].trim(), type });
        text = text.slice(0, idx) + ' ' + text.slice(idx + m[0].length);
        global.lastIndex = 0;
      }
    }
  };

  // Recurrence: "every day", "every 2 weeks", "every monday", "every! 3 days", "weekdays".
  consume(/\severy!?\s+(?:\d+\s+)?(day|days|week|weeks|month|months|year|years|weekday|weekdays|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/i, 'recurrence', (m) => {
    result.recurrence = m[0].trim().replace(/\s+/g, ' ');
    return true;
  });

  // Priority: p1..p4 (or !!1 style).
  consume(/\s(p[1-4])\b/i, 'priority', (m) => {
    result.priority = m[1].toUpperCase() as Priority;
    return true;
  });

  // Project: #Name (letters, digits, dashes, underscores).
  consume(/\s#([\p{L}0-9_-]+)/u, 'project', (m) => {
    result.projectName = m[1];
    return true;
  });

  // Labels: @Name (can be several).
  consume(/\s@([\p{L}0-9_-]+)/u, 'label', (m) => {
    result.labelNames.push(m[1]);
    return true;
  });

  // Times: "at 5pm", "at 17:00", or a bare "5:30pm".
  consume(/\s(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i, 'time', (m) => {
    const t = parseClock(m[1]);
    if (t) {
      result.dueTime = t;
      return true;
    }
    return false;
  });
  consume(/\sat\s+(\d{1,2}(?::\d{2})?)\b/i, 'time', (m) => {
    const t = parseClock(m[1]);
    if (t) {
      result.dueTime = t;
      return true;
    }
    return false;
  });
  consume(/\s(noon|midnight)\b/i, 'time', (m) => {
    result.dueTime = parseClock(m[1]);
    return true;
  });

  // Relative dates.
  const setDate = (d: Date) => {
    result.dueDate = startOfDay(d).toISOString();
  };

  consume(/\s(today|tonight)\b/i, 'date', () => {
    setDate(now);
    return true;
  });
  consume(/\s(tomorrow|tmrw)\b/i, 'date', () => {
    setDate(addDays(now, 1));
    return true;
  });
  consume(/\s(next week)\b/i, 'date', () => {
    setDate(addDays(now, 7));
    return true;
  });
  consume(/\sin\s+(\d+)\s+(day|days|week|weeks)\b/i, 'date', (m) => {
    const n = parseInt(m[1], 10);
    setDate(addDays(now, m[2].startsWith('week') ? n * 7 : n));
    return true;
  });
  // Named weekday, optionally "next monday".
  consume(/\s(?:next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/i, 'date', (m) => {
    const word = m[1].toLowerCase();
    let idx = WEEKDAYS.indexOf(word);
    if (idx === -1) idx = WEEKDAY_ABBR.indexOf(word);
    if (idx === -1) return false;
    setDate(nextWeekday(idx, now));
    return true;
  });

  result.title = text.replace(/\s+/g, ' ').trim();
  return result;
}
