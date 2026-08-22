import { createContext } from 'react';

/** Preferência escolhida pela pessoa. 'system' segue o sistema operacional. */
export type ThemePreference = 'light' | 'dark' | 'system';

/** Tema efetivamente aplicado, com 'system' já resolvido. */
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeContextValue {
  /** O que a pessoa escolheu. */
  preference: ThemePreference;
  /** O que está na tela agora. */
  resolved: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
}

export const THEME_STORAGE_KEY = 'financeia-theme';

export const ThemeContext = createContext<ThemeContextValue | null>(null);

const PREFERENCES: readonly ThemePreference[] = ['light', 'dark', 'system'];

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && PREFERENCES.includes(value as ThemePreference);
}

/** Lê a preferência salva. Devolve 'system' se não houver nada válido. */
export function readStoredPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : 'system';
  } catch {
    // localStorage pode lançar em modo privado ou com cookies bloqueados.
    return 'system';
  }
}

export function getSystemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  return preference === 'system' ? getSystemTheme() : preference;
}
