import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

/**
 * O jsdom não implementa matchMedia, e o ThemeProvider depende dele para
 * resolver a preferência 'system'. O mock é controlável por teste através de
 * setSystemPrefersDark.
 */
let systemPrefersDark = false;

export function setSystemPrefersDark(value: boolean): void {
  systemPrefersDark = value;
}

beforeEach(() => {
  systemPrefersDark = false;
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');

  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query.includes('prefers-color-scheme: dark') ? systemPrefersDark : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
