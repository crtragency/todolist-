'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icons';

type Phase = 'focus' | 'break';

export default function Pomodoro({ onClose }: { onClose: () => void }) {
  const [focusMin, setFocusMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [phase, setPhase] = useState<Phase>('focus');
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          // Phase transition.
          const nextPhase: Phase = phase === 'focus' ? 'break' : 'focus';
          if (phase === 'focus') setCompleted((c) => c + 1);
          setPhase(nextPhase);
          try {
            new Audio(
              'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ==',
            ).play();
          } catch {}
          return (nextPhase === 'focus' ? focusMin : breakMin) * 60;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, phase, focusMin, breakMin]);

  const reset = (p: Phase = 'focus') => {
    setRunning(false);
    setPhase(p);
    setRemaining((p === 'focus' ? focusMin : breakMin) * 60);
  };

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const total = (phase === 'focus' ? focusMin : breakMin) * 60;
  const progress = ((total - remaining) / total) * 100;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="card w-full max-w-xs p-6 text-center shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Focus timer</h2>
          <button className="btn-ghost p-1.5" onClick={onClose}>
            <Icon.Close />
          </button>
        </div>

        <div className="mb-2 inline-flex rounded-full bg-surface-2 p-1 text-xs">
          <button
            className={`rounded-full px-3 py-1 ${phase === 'focus' ? 'bg-surface font-semibold shadow-sm' : 'text-muted'}`}
            onClick={() => reset('focus')}
          >
            Focus
          </button>
          <button
            className={`rounded-full px-3 py-1 ${phase === 'break' ? 'bg-surface font-semibold shadow-sm' : 'text-muted'}`}
            onClick={() => reset('break')}
          >
            Break
          </button>
        </div>

        {/* Circular progress */}
        <div className="relative mx-auto my-4 h-44 w-44">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgb(var(--surface-2))" strokeWidth="6" />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgb(var(--accent))"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 45}
              strokeDashoffset={2 * Math.PI * 45 * (1 - progress / 100)}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-mono text-4xl font-bold tabular-nums">
              {mm}:{ss}
            </div>
            <div className="text-xs capitalize text-muted">{phase}</div>
          </div>
        </div>

        <div className="mb-4 flex justify-center gap-2">
          <button className="btn-primary px-6" onClick={() => setRunning((r) => !r)}>
            {running ? 'Pause' : 'Start'}
          </button>
          <button className="btn-ghost border border-border" onClick={() => reset(phase)}>
            Reset
          </button>
        </div>

        <div className="flex items-center justify-center gap-4 text-xs text-muted">
          <label className="flex items-center gap-1">
            Focus
            <input
              type="number"
              min={1}
              max={90}
              value={focusMin}
              onChange={(e) => {
                const v = Math.max(1, parseInt(e.target.value || '25', 10));
                setFocusMin(v);
                if (phase === 'focus' && !running) setRemaining(v * 60);
              }}
              className="w-12 rounded border border-border bg-surface px-1 py-0.5 text-center"
            />
          </label>
          <label className="flex items-center gap-1">
            Break
            <input
              type="number"
              min={1}
              max={30}
              value={breakMin}
              onChange={(e) => {
                const v = Math.max(1, parseInt(e.target.value || '5', 10));
                setBreakMin(v);
                if (phase === 'break' && !running) setRemaining(v * 60);
              }}
              className="w-12 rounded border border-border bg-surface px-1 py-0.5 text-center"
            />
          </label>
        </div>

        <p className="mt-3 text-xs text-muted">🍅 {completed} focus session(s) completed</p>
      </div>
    </div>
  );
}
