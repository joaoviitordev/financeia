import { describe, expect, it } from 'vitest';

import type { ChatMessage } from '@/features/insights/chat-types';
import type { InsightData } from '@/features/insights/types';
import { EMPTY_ANSWERS } from '@/features/onboarding/questions';
import {
  clearSimulations,
  deleteSimulation,
  getSimulation,
  listSimulations,
  saveSimulation,
  updateSimulation,
} from '@/features/simulations/storage';

const STORAGE_KEY = 'financeia:simulations:v1';

const answers = (overrides: Partial<typeof EMPTY_ANSWERS> = {}) => ({
  ...EMPTY_ANSWERS,
  renda: '5000',
  gastosFixos: '2000',
  guardado: '3000',
  objetivo: 'Comprar um carro',
  custoObjetivo: '45000',
  ...overrides,
});

// US-003 — A simulação sobrevive ao recarregar
describe('saveSimulation + getSimulation @spec:AC-007', () => {
  it('AC-007: guardar e reler devolve as mesmas respostas @spec:AC-007', () => {
    // Dado: um conjunto de respostas concluído
    const respostas = answers();

    // Quando: guardo a simulação e busco pelo identificador devolvido
    const id = saveSimulation(respostas);
    const found = getSimulation(id);

    // Então: recupero exatamente as mesmas respostas
    expect(found?.answers).toEqual(respostas);
  });

  it('devolve um identificador de simulação', () => {
    const id = saveSimulation(answers());

    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('não encontra uma simulação que nunca foi guardada', () => {
    expect(getSimulation('inexistente')).toBeUndefined();
  });
});

// US-003 — A simulação sobrevive ao recarregar
describe('listSimulations @spec:AC-008', () => {
  it('AC-008: cada simulação tem identificador próprio @spec:AC-008', () => {
    // Dado: que guardo duas simulações diferentes
    const primeiraId = saveSimulation(answers({ objetivo: 'Carro' }));
    const segundaId = saveSimulation(answers({ objetivo: 'Viagem' }));

    // Quando: listo o que está guardado
    const stored = listSimulations();

    // Então: as duas aparecem, com identificadores distintos
    expect(primeiraId).not.toBe(segundaId);
    expect(stored.map((record) => record.id)).toEqual(
      expect.arrayContaining([primeiraId, segundaId]),
    );
    expect(stored).toHaveLength(2);
  });
});

// US-003 — A simulação sobrevive ao recarregar
describe('listSimulations com armazenamento corrompido @spec:AC-009', () => {
  it('AC-009: armazenamento corrompido não derruba o app @spec:AC-009', () => {
    // Dado: que o armazenamento do navegador contém conteúdo inválido na chave da aplicação
    window.localStorage.setItem(STORAGE_KEY, '{ isso não é json válido');

    // Quando: listo as simulações guardadas
    const stored = listSimulations();

    // Então: recebo uma lista vazia, sem erro na tela
    expect(stored).toEqual([]);
  });

  it('trata JSON válido que não é um array como lista vazia', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ nao: 'é uma lista' }));

    expect(listSimulations()).toEqual([]);
  });

  it('descarta entradas do array que não têm o formato de simulação', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ id: 42, createdAt: 'ontem', answers: {} }, 'lixo', null]),
    );

    expect(listSimulations()).toEqual([]);
  });
});

describe('updateSimulation', () => {
  it('altera as respostas de uma simulação existente', () => {
    const id = saveSimulation(answers());

    const ok = updateSimulation(id, { answers: answers({ objetivo: 'Casa própria' }) });

    expect(ok).toBe(true);
    expect(getSimulation(id)?.answers.objetivo).toBe('Casa própria');
  });

  it('devolve false ao tentar atualizar um id que não existe', () => {
    expect(updateSimulation('inexistente', { answers: answers() })).toBe(false);
  });
});

/* --- O diagnóstico guardado junto (T-009) -------------------------------- */

const insight: InsightData = {
  feasibility: { status: 'viable', content: 'Cabe no orçamento.' },
  diagnosis: { content: 'Sobra mensal saudável.' },
  suggestions: { items: ['Automatize o aporte.'] },
  extraIncome: { items: [] },
  investment: { items: ['Tesouro Selic.'] },
  motivation: { content: 'Siga assim.' },
};

describe('o diagnóstico dentro da simulação', () => {
  it('guarda e relê o diagnóstico de uma simulação', () => {
    const id = saveSimulation(answers());

    expect(updateSimulation(id, { insight })).toBe(true);
    expect(getSimulation(id)?.insight).toEqual(insight);
  });

  it('apaga o diagnóstico quando o patch o traz vazio', () => {
    const id = saveSimulation(answers());
    updateSimulation(id, { insight });

    expect(updateSimulation(id, { insight: undefined })).toBe(true);
    expect(getSimulation(id)?.insight).toBeUndefined();
    // As respostas seguem intactas: quem some é só o texto.
    expect(getSimulation(id)?.answers.objetivo).toBe('Comprar um carro');
  });

  it('aceita simulação guardada antes de existir diagnóstico', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ id: 'antiga', createdAt: '2026-01-01T00:00:00.000Z', answers: answers() }]),
    );

    expect(listSimulations()).toHaveLength(1);
    expect(getSimulation('antiga')?.insight).toBeUndefined();
  });

  it('descarta só o diagnóstico corrompido, nunca a simulação', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { id: 'quebrada', createdAt: '2026-01-01T00:00:00.000Z', answers: answers(), insight: 7 },
      ]),
    );

    const [guardada] = listSimulations();

    expect(guardada?.id).toBe('quebrada');
    expect(guardada?.insight).toBeUndefined();
  });
});

/* --- A conversa dentro da simulação (T-017) ------------------------------ */

const mensagens: ChatMessage[] = [
  {
    id: 'm1',
    role: 'user',
    content: 'E se eu cortar o aluguel?',
    createdAt: '2026-08-23T12:00:00.000Z',
  },
  {
    id: 'm2',
    role: 'assistant',
    content: 'Cortando 300 por mês você chega dois meses antes.',
    createdAt: '2026-08-23T12:00:04.000Z',
  },
];

describe('a conversa dentro da simulação', () => {
  // US-015 — A conversa acompanha a simulação
  it('AC-045: A conversa sobrevive ao recarregar @spec:AC-045', () => {
    // Dado: uma conversa com perguntas e respostas numa simulação
    const id = saveSimulation(answers());
    expect(updateSimulation(id, { messages: mensagens })).toBe(true);

    // Quando: releio o armazenamento do zero, como faria um reload
    const relida = getSimulation(id);

    // Então: as mesmas mensagens, na mesma ordem. A prova é a releitura do
    // armazenamento, não o estado do React: estado sobrevive à remontagem por
    // acidente, armazenamento sobrevive de propósito.
    expect(relida?.messages).toEqual(mensagens);
    expect(relida?.messages?.map((m) => m.id)).toEqual(['m1', 'm2']);
  });

  // US-015 — A conversa acompanha a simulação
  it('AC-046: Mudar uma resposta descarta a conversa junto com o diagnóstico @spec:AC-046', () => {
    // Dado: uma simulação com diagnóstico e conversa guardados
    const id = saveSimulation(answers());
    updateSimulation(id, { insight, messages: mensagens });

    // Quando: uma resposta muda e os dois são descartados pelo mesmo caminho
    expect(
      updateSimulation(id, {
        answers: answers({ renda: '9000' }),
        insight: undefined,
        messages: undefined,
      }),
    ).toBe(true);

    // Então: nem conversa nem diagnóstico sobraram — os dois falavam dos
    // números que deixaram de valer.
    const relida = getSimulation(id);
    expect(relida?.messages).toBeUndefined();
    expect(relida?.insight).toBeUndefined();
    expect(relida?.answers.renda).toBe('9000');
  });

  it('aceita simulação guardada antes de existir conversa', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ id: 'antiga', createdAt: '2026-01-01T00:00:00.000Z', answers: answers() }]),
    );

    expect(listSimulations()).toHaveLength(1);
    expect(getSimulation('antiga')?.messages).toBeUndefined();
  });

  // ASM-026: a conversa quebrada custa a conversa, nunca o registro.
  it('descarta só a conversa corrompida, nunca a simulação nem o diagnóstico', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: 'quebrada',
          createdAt: '2026-01-01T00:00:00.000Z',
          answers: answers(),
          insight,
          messages: [mensagens[0], { id: 'm2' }],
        },
      ]),
    );

    const [guardada] = listSimulations();

    expect(guardada?.id).toBe('quebrada');
    expect(guardada?.messages).toBeUndefined();
    // O diagnóstico não é atingido: cada um responde pelo próprio formato.
    expect(guardada?.insight).toEqual(insight);
  });

  it('excluir a simulação leva a conversa junto', () => {
    const id = saveSimulation(answers());
    updateSimulation(id, { messages: mensagens });

    expect(deleteSimulation(id)).toBe(true);
    expect(getSimulation(id)).toBeUndefined();
  });
});

/* --- Excluir e limpar (T-014) -------------------------------------------- */

describe('deleteSimulation', () => {
  // US-011 — Apagar o que não quero mais
  it('AC-033: Excluir remove só a simulação escolhida, para sempre @spec:AC-033', () => {
    const primeira = saveSimulation(answers({ objetivo: 'Viagem' }));
    const segunda = saveSimulation(answers({ objetivo: 'Carro' }));
    const terceira = saveSimulation(answers({ objetivo: 'Casa' }));

    expect(deleteSimulation(segunda)).toBe(true);

    // As outras duas continuam guardadas...
    expect(listSimulations().map((record) => record.id)).toEqual([primeira, terceira]);
    // ...e a excluída não volta numa leitura nova do armazenamento.
    expect(getSimulation(segunda)).toBeUndefined();
  });

  it('devolve false para um id que não existe, sem mexer no resto', () => {
    const id = saveSimulation(answers());

    expect(deleteSimulation('inexistente')).toBe(false);
    expect(listSimulations()).toHaveLength(1);
    expect(getSimulation(id)).toBeDefined();
  });
});

describe('clearSimulations', () => {
  // US-011 — Apagar o que não quero mais
  it('AC-034: Apagar tudo limpa o histórico inteiro, com a mesma cerimônia @spec:AC-034', () => {
    saveSimulation(answers());
    saveSimulation(answers({ objetivo: 'Carro' }));

    expect(clearSimulations()).toBe(true);

    expect(listSimulations()).toEqual([]);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('limpar duas vezes seguidas continua sendo verdade', () => {
    saveSimulation(answers());

    expect(clearSimulations()).toBe(true);
    expect(clearSimulations()).toBe(true);
  });
});
