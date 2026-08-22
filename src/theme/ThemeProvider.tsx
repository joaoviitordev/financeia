import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import {
  getSystemTheme,
  readStoredPreference,
  type ResolvedTheme,
  resolveTheme,
  THEME_STORAGE_KEY,
  ThemeContext,
  type ThemeContextValue,
  type ThemePreference,
} from '@/theme/theme-context';

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Aplica o tema gravando data-theme no elemento raiz.
 *
 * Grava sempre um valor concreto ('light' ou 'dark'), nunca 'system', porque os
 * escopos de tema no CSS e a variante dark: dependem disso. A preferência
 * 'system' vive no React e no localStorage, não no DOM.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference);
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolveTheme(preference));

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    setResolved(resolveTheme(next));
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Sem persistência, a escolha ainda vale para esta sessão.
    }
  }, []);

  // Só acompanha o sistema enquanto a preferência for 'system'. Uma escolha
  // explícita não pode ser sobrescrita pelo SO mudando de tema.
  useEffect(() => {
    if (preference !== 'system') {
      return;
    }

    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      setResolved(getSystemTheme());
    };

    handleChange();
    query.addEventListener('change', handleChange);

    return () => {
      query.removeEventListener('change', handleChange);
    };
  }, [preference]);

  useEffect(() => {
    document.documentElement.dataset['theme'] = resolved;
  }, [resolved]);

  const value = useMemo<ThemeContextValue>(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}
