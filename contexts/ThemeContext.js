'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'ritual-theme';

function getSystemTheme() {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(next) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (next === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
  root.style.colorScheme = next;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [userOverride, setUserOverride] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') {
      setTheme(stored);
      setUserOverride(true);
      applyTheme(stored);
    } else {
      const sys = getSystemTheme();
      setTheme(sys);
      applyTheme(sys);
    }
  }, []);

  // Live-follow the OS preference when the user has NOT set a manual override.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      if (userOverride) return;
      const next = e.matches ? 'dark' : 'light';
      setTheme(next);
      applyTheme(next);
    };
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, [userOverride]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, next);
      setUserOverride(true);
      applyTheme(next);
      return next;
    });
  }, []);

  const resetToSystem = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUserOverride(false);
    const sys = getSystemTheme();
    setTheme(sys);
    applyTheme(sys);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, resetToSystem, userOverride }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
