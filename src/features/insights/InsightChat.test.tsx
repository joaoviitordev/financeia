// Spec da feature chat-educador (T-019).
// Cada teste prova um critério de aceite; a tag @spec:AC-xxx no título é o
// que liga o teste à especificação em .spec/features/chat-educador/.
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ChatMessage } from '@/features/insights/chat-types';
import { InsightChat } from '@/features/insights/InsightChat';
import type { InsightData } from '@/features/insights/types';
import { EMPTY_ANSWERS } from '@/features/onboarding/questions';
import type { SimulationRecord } from '@/features/simulations/storage';

const INSIGHT: InsightData = {
  feasibility: { status: 'viable', content: 'A meta cabe no seu orçamento.' },
  diagnosis: { content: 'Sobra saudável todo mês.' },
  suggestions: { items: ['Automatize o aporte.'] },
  extraIncome: { items: [] },
  investment: { items: ['Tesouro Selic.'] },
  motivation: { content: 'Siga assim.' },
};

function simulacao(messages?: ChatMessage[]): SimulationRecord {
  return {
    id: 's1',
    createdAt: '2026-08-23T12:00:00.000Z',
    answers: {
      ...EMPTY_ANSWERS,
      renda: '5000',
      gastosFixos: '2000',
      dividas: '0',
      guardado: '3000',
      objetivo: 'Comprar um carro',
      custoObjetivo: '45000',
      prazo: '12',
    },
    insight: INSIGHT,
    ...(messages === undefined ? {} : { messages }),
  };
}

function mensagem(id: string, role: ChatMessage['role'], content: string): ChatMessage {
  return { id, role, content, createdAt: '2026-08-23T12:00:00.000Z' };
}

/** O Gemini respondendo texto livre. */
function respondeCom(texto: string) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ candidates: [{ content: { parts: [{ text: texto }] } }] }),
  });
  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

/** Uma resposta que só chega quando o teste mandar. */
function respondeQuandoEuMandar() {
  let liberar: (texto: string) => void = () => undefined;
  const promessa = new Promise<string>((resolve) => {
    liberar = resolve;
  });

  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(async () => {
      const texto = await promessa;
      return {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ candidates: [{ content: { parts: [{ text: texto }] } }] }),
      };
    }),
  );

  return {
    liberar: (texto: string) => {
      liberar(texto);
    },
  };
}

function renderChat(messages?: ChatMessage[]) {
  const onMessagesChange = vi.fn();
  render(<InsightChat record={simulacao(messages)} onMessagesChange={onMessagesChange} />);

  return { onMessagesChange };
}

/**
 * O jsdom não implementa scrollIntoView, e o AC-044 depende de chamá-lo. O
 * dublê carrega a assinatura real para o typecheck não engolir um mock que
 * aceitaria qualquer coisa.
 */
type ScrollIntoView = (arg?: boolean | ScrollIntoViewOptions) => void;

let scrollIntoView: ReturnType<typeof vi.fn<ScrollIntoView>>;

beforeEach(() => {
  vi.stubEnv('VITE_GEMINI_API_KEY', 'chave-de-teste');
  scrollIntoView = vi.fn<ScrollIntoView>();
  Element.prototype.scrollIntoView = scrollIntoView;
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('InsightChat', () => {
  // US-013 — Perguntar sobre o meu plano
  it('AC-039: Perguntar devolve uma resposta na conversa @spec:AC-039', async () => {
    const user = userEvent.setup();
    respondeCom('Cortando 300 por mês você chega dois meses antes.');
    const { onMessagesChange } = renderChat();

    // Quando: escrevo uma pergunta e envio
    await user.type(screen.getByLabelText('Sua pergunta'), 'E se eu cortar o aluguel?');
    await user.click(screen.getByRole('button', { name: 'Enviar pergunta' }));

    // Então: minha pergunta entra na conversa...
    expect(await screen.findByText('E se eu cortar o aluguel?')).toBeInTheDocument();
    // ...e a resposta do educador entra abaixo dela.
    expect(
      await screen.findByText('Cortando 300 por mês você chega dois meses antes.'),
    ).toBeInTheDocument();

    const itens = screen.getAllByRole('listitem');
    expect(within(itens[0]!).getByText('E se eu cortar o aluguel?')).toBeInTheDocument();
    expect(
      within(itens[1]!).getByText('Cortando 300 por mês você chega dois meses antes.'),
    ).toBeInTheDocument();

    // E quem guarda o registro foi avisado, para a conversa sobreviver.
    await waitFor(() => {
      expect(onMessagesChange).toHaveBeenCalled();
    });
    const [ultima] = onMessagesChange.mock.calls.at(-1) as [ChatMessage[]];
    expect(ultima.map((m) => [m.role, m.content])).toEqual([
      ['user', 'E se eu cortar o aluguel?'],
      ['assistant', 'Cortando 300 por mês você chega dois meses antes.'],
    ]);
  });

  it('mostra a conversa já guardada assim que abre', () => {
    renderChat([
      mensagem('m1', 'user', 'E o prazo?'),
      mensagem('m2', 'assistant', 'Dá para encurtar dois meses.'),
    ]);

    expect(screen.getByText('E o prazo?')).toBeInTheDocument();
    expect(screen.getByText('Dá para encurtar dois meses.')).toBeInTheDocument();
  });

  // US-014 — Escrever sem atrito
  it('AC-042: Enter envia, Shift+Enter quebra linha @spec:AC-042', async () => {
    const user = userEvent.setup();
    const fetchMock = respondeCom('Resposta.');
    renderChat();

    const campo = screen.getByLabelText('Sua pergunta');

    // Shift+Enter não envia: o texto ganha uma linha nova.
    await user.type(campo, 'primeira linha{Shift>}{Enter}{/Shift}segunda linha');
    expect(campo).toHaveValue('primeira linha\nsegunda linha');
    expect(fetchMock).not.toHaveBeenCalled();

    // Enter sozinho envia.
    await user.type(campo, '{Enter}');
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    // O getByText normaliza espaço em branco, e a quebra vira um espaço na
    // consulta — o valor do campo, conferido acima, é quem prova que ela existe.
    expect(await screen.findByText('primeira linha segunda linha')).toBeInTheDocument();
  });

  // US-014 — Escrever sem atrito
  it('AC-043: Não dá para enviar vazio nem duas vezes @spec:AC-043', async () => {
    const user = userEvent.setup();
    const { liberar } = respondeQuandoEuMandar();
    renderChat();

    const enviar = screen.getByRole('button', { name: 'Enviar pergunta' });
    const campo = screen.getByLabelText('Sua pergunta');

    // Campo vazio: bloqueado.
    expect(enviar).toBeDisabled();
    // Só espaços também é vazio.
    await user.type(campo, '   ');
    expect(enviar).toBeDisabled();

    // Com texto: liberado.
    await user.clear(campo);
    await user.type(campo, 'uma pergunta');
    expect(enviar).toBeEnabled();

    // Enviada e ainda em voo: bloqueado de novo.
    await user.click(enviar);
    await waitFor(() => {
      expect(enviar).toBeDisabled();
    });
    await user.type(campo, 'outra pergunta');
    expect(enviar).toBeDisabled();

    // A resposta chegando devolve o envio.
    liberar('Resposta.');
    await waitFor(() => {
      expect(enviar).toBeEnabled();
    });
  });

  // US-014 — Escrever sem atrito
  it('AC-044: A conversa rola até a mensagem nova @spec:AC-044', async () => {
    const user = userEvent.setup();
    respondeCom('Resposta.');
    renderChat();

    scrollIntoView.mockClear();

    await user.type(screen.getByLabelText('Sua pergunta'), 'uma pergunta{Enter}');

    await waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalled();
    });
    // Sem preferência declarada, a rolagem é animada.
    expect(scrollIntoView).toHaveBeenLastCalledWith({ behavior: 'smooth' });
  });

  it('quem pediu menos movimento recebe o salto, não a animação', async () => {
    const user = userEvent.setup();
    respondeCom('Resposta.');
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
    renderChat();

    scrollIntoView.mockClear();

    await user.type(screen.getByLabelText('Sua pergunta'), 'uma pergunta{Enter}');

    await waitFor(() => {
      expect(scrollIntoView).toHaveBeenLastCalledWith({ behavior: 'auto' });
    });
  });

  // US-016 — Uma pergunta que falha não leva a conversa junto
  it('AC-047: Enquanto a resposta não chega, a pergunta mostra que ela está vindo @spec:AC-047', async () => {
    const user = userEvent.setup();
    const { liberar } = respondeQuandoEuMandar();
    renderChat([mensagem('m1', 'user', 'pergunta antiga')]);

    await user.type(screen.getByLabelText('Sua pergunta'), 'pergunta nova{Enter}');

    // A pergunta enviada mostra que a resposta está a caminho...
    expect(await screen.findByText('Escrevendo a resposta…')).toBeInTheDocument();
    expect(screen.getByText('pergunta nova')).toBeInTheDocument();
    // ...e o resto da conversa continua legível.
    expect(screen.getByText('pergunta antiga')).toBeInTheDocument();

    liberar('Chegou.');
    await waitFor(() => {
      expect(screen.queryByText('Escrevendo a resposta…')).not.toBeInTheDocument();
    });
  });

  // US-016 — Uma pergunta que falha não leva a conversa junto
  it('AC-048: A pergunta que falhou é dita pelo nome e pode ser reenviada @spec:AC-048', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 429, json: () => Promise.resolve({}) }),
    );
    const { onMessagesChange } = renderChat([
      mensagem('m1', 'user', 'pergunta antiga'),
      mensagem('m2', 'assistant', 'resposta antiga'),
    ]);

    await user.type(screen.getByLabelText('Sua pergunta'), 'pergunta que falha{Enter}');

    // A falha aparece naquela pergunta, com o motivo pelo nome (cota, não
    // "erro inesperado") e um caminho para tentar de novo.
    expect(await screen.findByText(/cota da chave acabou/i)).toBeInTheDocument();
    const tentarDeNovo = screen.getByRole('button', { name: 'Tentar de novo' });

    // As mensagens anteriores continuam todas ali.
    expect(screen.getByText('pergunta antiga')).toBeInTheDocument();
    expect(screen.getByText('resposta antiga')).toBeInTheDocument();
    // E nada foi gravado: a pergunta não virou par.
    expect(onMessagesChange).not.toHaveBeenCalled();

    // Reenviar, agora com o serviço de pé, fecha o par.
    respondeCom('Agora foi.');
    await user.click(tentarDeNovo);

    expect(await screen.findByText('Agora foi.')).toBeInTheDocument();
    expect(screen.queryByText(/cota da chave acabou/i)).not.toBeInTheDocument();
    await waitFor(() => {
      expect(onMessagesChange).toHaveBeenCalled();
    });
  });
});
