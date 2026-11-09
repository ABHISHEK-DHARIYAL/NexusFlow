import { create } from 'zustand';
import { Theme } from '../types';

interface ThemeState {
  theme: Theme;
  effectiveTheme: 'dark' | 'light';
  setTheme: (theme: Theme) => void;
}

const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem('nexusflow_theme') as Theme;
  return stored || 'dark';
};

const applyThemeToDOM = (theme: Theme): 'dark' | 'light' => {
  const root = document.documentElement;
  let effective: 'dark' | 'light' = 'dark';

  if (theme === 'system') {
    effective = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  } else {
    effective = theme;
  }

  if (effective === 'light') {
    root.classList.add('light');
    root.classList.remove('dark');
  } else {
    root.classList.add('dark');
    root.classList.remove('light');
  }

  return effective;
};

const initialTheme = getStoredTheme();
const initialEffective = applyThemeToDOM(initialTheme);

export const useThemeStore = create<ThemeState>((set) => ({
  theme: initialTheme,
  effectiveTheme: initialEffective,
  setTheme: (theme: Theme) => {
    localStorage.setItem('nexusflow_theme', theme);
    const effective = applyThemeToDOM(theme);
    set({ theme, effectiveTheme: effective });
  },
}));
