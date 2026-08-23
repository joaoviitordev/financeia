// Spec da feature chat-educador (T-018).
// Cada teste prova um critério de aceite; a tag @spec:AC-xxx no título é o
// que liga o teste à especificação em .spec/features/chat-educador/.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildChatPrompt, CHAT_CONTEXT_LIMIT, sendChatMessage } from '@/features/insights/chat';
import type { ChatMessage } from '@/features/insights/chat-types';
import type { InsightData } from '@/features/insights/types';
import { EMPTY_ANSWERS } from '@/features/onboarding/questions';
import type { SimulationRecord } from '@/features/simulations/storage';
import { formatBRL } from '@/lib/format';

const INSIGHT: InsightData = {
  feasibility: { status: 'viable', content: 'A meta cabe no seu orçamento.' },
  diagnosis: { content: 'Sobra saudável todo mês.' },
  suggestions: { items: ['Automatize o aporte.'] },
  extraIncome: { items: ['Freelas no fim de semana.'] },
  investment: { items: ['Tesouro Selic.'] },
  motivation: { content: 'Siga assim.' },
};

function simulacao(overrides: Partial<SimulationRecord> = {}): SimulationRecord {
  return {
    id: 's1',
    createdAt: '2026-08-23T12:00:00.000Z',
    answers: {
      ...EMPTY_ANSWERS,
      renda: '5000',
      gastosFixos: '2000',
      dividas: '300',
      guardado: '3000',
      objetivo: 'Comprar um carro',
      custoObjetivo: '45000',
      prazo: '12',
    },
    insight: INSIGHT,
    ...overrides,
  };
}

function mensagem(n: number, role: ChatMessage['role'] = 'user'): ChatMessage {
  return {
    id: `m${String(n)}`,
    role,
    content: `mensagem número ${String(n)}`,
    createdAt: '2026-08-23T12:00:00.000Z',
  };
}

describe('buildChatPrompt', () => {
  // US-013 — Perguntar sobre o meu plano
  it('AC-040: O pedido carrega a simulação, o diagnóstico e a conversa até aqui @spec:AC-040', () => {
    // Dado: uma conversa que já tem perguntas e respostas anteriores
    const record = simulacao({
      messages: [
        { ...mensagem(1), content: 'E se eu cortar o aluguel?' },
        { ...mensagem(2, 'assistant'), content: 'Você chega dois meses antes.' },
      ],
    });

    // Quando: envio mais uma pergunta
    const prompt = buildChatPrompt(record, 'E se eu aumentar o prazo?');

    // Então: os números da simulação estão lá, formatados pelo mesmo `formatBRL`
    // que a tela usa — comparar com literal esbarraria no espaço não separável
    // que o Intl põe depois do "R$".
    expect(prompt).toContain(formatBRL(5000)); // renda
    expect(prompt).toContain(formatBRL(45000)); // custo do objetivo
    expect(prompt).toContain('Comprar um carro');
    expect(prompt).toContain('12 meses');
    // ...a sobra mensal já calculada (5000 − 2000 − 300)...
    expect(prompt).toContain(formatBRL(2700));

    // ...o diagnóstico já gerado...
    expect(prompt).toContain('A meta cabe no seu orçamento.');
    expect(prompt).toContain('Sobra saudável todo mês.');
    expect(prompt).toContain('Automatize o aporte.');

    // ...e a conversa anterior, com a pergunta nova por último.
    expect(prompt).toContain('E se eu cortar o aluguel?');
    expect(prompt).toContain('Você chega dois meses antes.');
    expect(prompt.trimEnd()).toContain('E se eu aumentar o prazo?');
  });

  // US-013 — Perguntar sobre o meu plano
  it('AC-041: A conversa enviada tem teto @spec:AC-041', () => {
    // Dado: uma conversa com mais mensagens do que o teto de contexto
    const antigas = Array.from({ length: CHAT_CONTEXT_LIMIT + 5 }, (_, i) => mensagem(i + 1));

    // Quando: envio mais uma pergunta
    const prompt = buildChatPrompt(simulacao({ messages: antigas }), 'a pergunta nova');

    // Então: as mais antigas ficaram de fora...
    expect(prompt).not.toContain('mensagem número 1\n');
    expect(prompt).not.toContain('mensagem número 6');

    // ...as mais recentes entraram...
    expect(prompt).toContain('mensagem número 15');

    // ...e a pergunta nova está entre elas, contando para o teto: 9 antigas
    // mais a nova fecham exatamente CHAT_CONTEXT_LIMIT.
    expect(prompt).toContain('a pergunta nova');
    const linhas = prompt.split('\n').filter((linha) => /^(Pessoa|Você): /.test(linha));
    expect(linhas).toHaveLength(CHAT_CONTEXT_LIMIT);
  });

  it('funciona na primeira pergunta, quando ainda não há conversa', () => {
    const prompt = buildChatPrompt(simulacao({ messages: undefined }), 'primeira dúvida');

    expect(prompt).toContain('primeira dúvida');
    const linhas = prompt.split('\n').filter((linha) => /^(Pessoa|Você): /.test(linha));
    expect(linhas).toHaveLength(1);
  });

  it('separa os dois lados da conversa por quem fala', () => {
    const prompt = buildChatPrompt(
      simulacao({ messages: [mensagem(1), mensagem(2, 'assistant')] }),
      'e agora?',
    );

    expect(prompt).toContain('Pessoa: mensagem número 1');
    expect(prompt).toContain('Você: mensagem número 2');
  });
});

describe('sendChatMessage', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'chave-de-teste');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  function respondeCom(payload: unknown, init: Partial<Response> = {}) {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: init.ok ?? true,
      status: init.status ?? 200,
      json: () => Promise.resolve(payload),
    });
    vi.stubGlobal('fetch', fetchMock);

    return fetchMock;
  }

  it('devolve a resposta em prosa', async () => {
    respondeCom({ candidates: [{ content: { parts: [{ text: '  Corte o streaming.  ' }] } }] });

    const resultado = await sendChatMessage('pergunta');

    expect(resultado).toEqual({ ok: true, content: 'Corte o streaming.' });
  });

  // ASM-024: pedir JSON aqui faria o modelo embrulhar a frase num objeto.
  it('não pede JSON ao modelo, e manda a chave no header', async () => {
    const fetchMock = respondeCom({ candidates: [{ content: { parts: [{ text: 'ok' }] } }] });

    await sendChatMessage('pergunta');

    const [, init] = fetchMock.mock.calls[0] as [
      string,
      { body: string; headers: Record<string, string> },
    ];
    const body = JSON.parse(init.body) as Record<string, unknown>;
    expect(body['generationConfig']).toBeUndefined();
    expect(init.headers['x-goog-api-key']).toBe('chave-de-teste');
  });

  it('sem chave configurada, nem tenta a rede', async () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', '');
    const fetchMock = respondeCom({});

    const resultado = await sendChatMessage('pergunta');

    expect(resultado.ok).toBe(false);
    expect(resultado.ok ? null : resultado.error.kind).toBe('missing-key');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // Cada causa com nome próprio, o mesmo vocabulário do diagnóstico.
  it.each([
    [401, 'invalid-key'],
    [403, 'invalid-key'],
    [429, 'quota'],
    [500, 'network'],
  ])('status %i vira a falha %s', async (status, kind) => {
    respondeCom({}, { ok: false, status });

    const resultado = await sendChatMessage('pergunta');

    expect(resultado.ok ? null : resultado.error.kind).toBe(kind);
  });

  it('a rede caindo vira falha de rede, não exceção', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('sem conexão')));

    const resultado = await sendChatMessage('pergunta');

    expect(resultado.ok ? null : resultado.error.kind).toBe('network');
  });

  it('resposta sem texto aproveitável vira erro tratado', async () => {
    respondeCom({ candidates: [] });

    const resultado = await sendChatMessage('pergunta');

    expect(resultado.ok ? null : resultado.error.kind).toBe('unexpected-response');
  });

  it('resposta só com espaços conta como vazia', async () => {
    respondeCom({ candidates: [{ content: { parts: [{ text: '   ' }] } }] });

    const resultado = await sendChatMessage('pergunta');

    expect(resultado.ok ? null : resultado.error.kind).toBe('unexpected-response');
  });
});
