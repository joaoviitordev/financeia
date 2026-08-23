import { describe, expect, it } from 'vitest';

import { type ChatMessage, isChatMessage, isChatMessages } from '@/features/insights/chat-types';

const MENSAGEM: ChatMessage = {
  id: 'm1',
  role: 'user',
  content: 'E se eu cortar o aluguel?',
  createdAt: '2026-08-23T12:00:00.000Z',
};

describe('isChatMessage', () => {
  it('aceita uma mensagem completa dos dois lados da conversa', () => {
    expect(isChatMessage(MENSAGEM)).toBe(true);
    expect(isChatMessage({ ...MENSAGEM, role: 'assistant' })).toBe(true);
  });

  it('recusa o que não é objeto', () => {
    expect(isChatMessage(null)).toBe(false);
    expect(isChatMessage('mensagem')).toBe(false);
    expect(isChatMessage(undefined)).toBe(false);
  });

  it('recusa mensagem sem algum dos quatro campos', () => {
    for (const campo of ['id', 'role', 'content', 'createdAt'] as const) {
      const { [campo]: _faltando, ...incompleta } = MENSAGEM;
      expect(isChatMessage(incompleta)).toBe(false);
    }
  });

  // Um papel desconhecido decidiria de que lado a mensagem aparece — errar
  // isso põe na boca do educador o que a pessoa escreveu.
  it('recusa papel fora dos dois conhecidos', () => {
    expect(isChatMessage({ ...MENSAGEM, role: 'system' })).toBe(false);
    expect(isChatMessage({ ...MENSAGEM, role: '' })).toBe(false);
  });
});

describe('isChatMessages', () => {
  it('aceita lista vazia e lista de mensagens válidas', () => {
    expect(isChatMessages([])).toBe(true);
    expect(isChatMessages([MENSAGEM, { ...MENSAGEM, id: 'm2', role: 'assistant' }])).toBe(true);
  });

  it('recusa a lista inteira quando uma mensagem está corrompida', () => {
    expect(isChatMessages([MENSAGEM, { id: 'm2' }])).toBe(false);
  });

  it('recusa o que não é lista', () => {
    expect(isChatMessages(MENSAGEM)).toBe(false);
    expect(isChatMessages(null)).toBe(false);
  });
});
