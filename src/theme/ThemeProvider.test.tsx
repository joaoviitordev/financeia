import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { THEME_STORAGE_KEY } from '@/theme/theme-context';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { useTheme } from '@/theme/useTheme';

import { setSystemPrefersDark } from '../../vitest.setup';

function Probe() {
  const { preference, resolved, setPreference } = useTheme();

  return (
    <div>
      <span data-testid="preference">{preference}</span>
      <span data-testid="resolved">{resolved}</span>
      <button
        type="button"
        onClick={() => {
          setPreference('dark');
        }}
      >
        escuro
      </button>
      <button
        type="button"
        onClick={() => {
          setPreference('system');
        }}
      >
        sistema
      </button>
    </div>
  );
}

function renderProbe() {
  return render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>,
  );
}

describe('ThemeProvider', () => {
  it('começa em "system" e resolve para claro quando o SO está claro', () => {
    setSystemPrefersDark(false);
    renderProbe();

    expect(screen.getByTestId('preference')).toHaveTextContent('system');
    expect(screen.getByTestId('resolved')).toHaveTextContent('light');
  });

  it('resolve para escuro quando o SO prefere escuro', () => {
    setSystemPrefersDark(true);
    renderProbe();

    expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
  });

  it('grava um data-theme concreto na raiz, nunca "system"', async () => {
    setSystemPrefersDark(false);
    renderProbe();

    expect(document.documentElement.dataset['theme']).toBe('light');

    await userEvent.click(screen.getByRole('button', { name: 'sistema' }));

    // Mesmo com a preferência em 'system', o DOM recebe o valor resolvido —
    // os escopos de tema no CSS dependem disso.
    expect(document.documentElement.dataset['theme']).toBe('light');
  });

  it('persiste a escolha explícita e ela vence o sistema', async () => {
    setSystemPrefersDark(false);
    renderProbe();

    await userEvent.click(screen.getByRole('button', { name: 'escuro' }));

    expect(screen.getByTestId('preference')).toHaveTextContent('dark');
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('lê a preferência salva na montagem', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    setSystemPrefersDark(false);
    renderProbe();

    expect(screen.getByTestId('preference')).toHaveTextContent('dark');
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
  });

  it('ignora valor inválido no localStorage e cai para "system"', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'roxo');
    renderProbe();

    expect(screen.getByTestId('preference')).toHaveTextContent('system');
  });
});
