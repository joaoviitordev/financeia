import { describe, expect, it } from 'vitest';

import { EMPTY_ANSWERS } from '@/features/onboarding/questions';
import {
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
