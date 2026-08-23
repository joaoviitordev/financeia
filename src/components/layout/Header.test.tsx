import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Header } from '@/components/layout/Header';
import { ThemeProvider } from '@/theme/ThemeProvider';

function renderHeader(props: Partial<Parameters<typeof Header>[0]> = {}) {
  const onNewSimulation = vi.fn();
  const onShowHistory = vi.fn();

  render(
    <ThemeProvider>
      <Header onNewSimulation={onNewSimulation} onShowHistory={onShowHistory} {...props} />
    </ThemeProvider>,
  );

  return { onNewSimulation, onShowHistory };
}

describe('Header', () => {
  it('é um landmark banner e mostra a marca', () => {
    renderHeader();

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('Finance IA')).toBeInTheDocument();
  });

  it('dispara as ações de nova simulação e de histórico', async () => {
    const user = userEvent.setup();
    const { onNewSimulation, onShowHistory } = renderHeader();

    await user.click(screen.getByRole('button', { name: 'Nova simulação' }));
    await user.click(screen.getByRole('button', { name: 'Suas simulações' }));

    expect(onNewSimulation).toHaveBeenCalledTimes(1);
    expect(onShowHistory).toHaveBeenCalledTimes(1);
  });

  it('cicla a aparência entre claro, escuro e sistema', async () => {
    const user = userEvent.setup();
    renderHeader();

    // Sem preferência salva o padrão é 'sistema', e o rótulo diz para onde o
    // próximo clique leva. É esse contrato que impede o botão de virar um
    // interruptor binário e perder a opção de seguir o sistema.
    const toggle = () => screen.getByRole('button', { name: /^Aparência:/ });

    expect(toggle()).toHaveAccessibleName('Aparência: sistema. Trocar para claro.');

    await user.click(toggle());
    expect(toggle()).toHaveAccessibleName('Aparência: claro. Trocar para escuro.');

    await user.click(toggle());
    expect(toggle()).toHaveAccessibleName('Aparência: escuro. Trocar para sistema.');

    await user.click(toggle());
    expect(toggle()).toHaveAccessibleName('Aparência: sistema. Trocar para claro.');
  });
});
