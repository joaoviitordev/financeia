import { use } from 'react';

import { ThemeContext, type ThemeContextValue } from '@/theme/theme-context';

export function useTheme(): ThemeContextValue {
  const context = use(ThemeContext);

  if (context === null) {
    throw new Error('useTheme precisa estar dentro de <ThemeProvider>.');
  }

  return context;
}
