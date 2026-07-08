'use client';

import { useEffect, useState, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeColor = '' | 'blue' | 'violet' | 'green' | 'pink' | 'amber' | 'teal';

export const THEME_COLORS: { id: ThemeColor; name: string; swatch: string }[] = [
  { id: '', name: 'Tomato', swatch: '#e03131' },
  { id: 'blue', name: 'Ocean', swatch: '#2176d1' },
  { id: 'violet', name: 'Grape', swatch: '#7c4dff' },
  { id: 'green', name: 'Forest', swatch: '#16a34a' },
  { id: 'pink', name: 'Rose', swatch: '#db2777' },
  { id: 'amber', name: 'Amber', swatch: '#d97706' },
  { id: 'teal', name: 'Teal', swatch: '#0d9488' },
];

function applyMode(mode: ThemeMode) {
  const dark =
    mode === 'dark' ||
    (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
}

function applyColor(color: ThemeColor) {
  if (color) document.documentElement.setAttribute('data-theme', color);
  else document.documentElement.removeAttribute('data-theme');
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>('system');
  const [color, setColor] = useState<ThemeColor>('');

  useEffect(() => {
    const m = (localStorage.getItem('theme-mode') as ThemeMode) || 'system';
    const c = (localStorage.getItem('theme-color') as ThemeColor) || '';
    setMode(m);
    setColor(c);
  }, []);

  const changeMode = useCallback((m: ThemeMode) => {
    setMode(m);
    localStorage.setItem('theme-mode', m);
    applyMode(m);
  }, []);

  const changeColor = useCallback((c: ThemeColor) => {
    setColor(c);
    localStorage.setItem('theme-color', c);
    applyColor(c);
  }, []);

  const toggleDark = useCallback(() => {
    const isDark = document.documentElement.classList.contains('dark');
    changeMode(isDark ? 'light' : 'dark');
  }, [changeMode]);

  return { mode, color, changeMode, changeColor, toggleDark };
}
