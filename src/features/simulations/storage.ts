import { type InsightData, isInsightData } from '@/features/insights/types';
import type { Answers } from '@/features/onboarding/questions';

/**
 * Armazenamento das simulações.
 *
 * O sufixo de versão na chave evita adivinhar formato antigo quando o schema
 * mudar (ASM-002). O localStorage é tratado como hostil: outra aba, uma
 * extensão ou uma versão anterior do app podem ter deixado algo que não é
 * mais um array de simulações válido, e o navegador pode recusar a escrita a
 * qualquer momento (quota estourada, modo privado). Nada disso pode derrubar
 * a tela — leitura corrompida vira lista vazia, escrita que falha vira false.
 */
const STORAGE_KEY = 'financeia:simulations:v1';

export interface SimulationRecord {
  id: string;
  createdAt: string;
  answers: Answers;
  /** O diagnóstico já gerado. Ausente enquanto ninguém abriu o resultado. */
  insight?: InsightData;
}

/**
 * O que pode ser corrigido depois de guardado. O id nunca muda.
 *
 * `insight: undefined` apaga o diagnóstico: é assim que uma resposta alterada
 * descarta o texto que falava dos números antigos (AC-026).
 */
export type SimulationPatch = Partial<Pick<SimulationRecord, 'answers' | 'insight'>>;

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function isAnswers(value: unknown): value is Answers {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return Object.values(value).every((field) => typeof field === 'string');
}

function isSimulationRecord(value: unknown): value is SimulationRecord {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record['id'] === 'string' &&
    typeof record['createdAt'] === 'string' &&
    isAnswers(record['answers'])
  );
}

/**
 * Um diagnóstico corrompido custa o diagnóstico daquele registro, nunca o
 * registro nem a lista: as respostas continuam lá, e a próxima abertura da
 * página de resultado simplesmente gera outro.
 */
function withValidInsight(record: SimulationRecord): SimulationRecord {
  if (record.insight === undefined || isInsightData(record.insight)) {
    return record;
  }
  const { insight: _descartado, ...semInsight } = record;

  return semInsight;
}

/** Lê a chave inteira, descartando qualquer entrada que não seja uma simulação válida. */
function readAll(): SimulationRecord[] {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return [];
  }
  if (raw === null) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!isUnknownArray(parsed)) {
    return [];
  }
  return parsed.filter(isSimulationRecord).map(withValidInsight);
}

/** Grava a lista inteira. Devolve false quando o navegador recusa a escrita. */
function writeAll(records: readonly SimulationRecord[]): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return true;
  } catch {
    return false;
  }
}

/** Todas as simulações guardadas, mais recente por último. Nunca lança. */
export function listSimulations(): SimulationRecord[] {
  return readAll();
}

/** Uma simulação pelo id, ou undefined se não existir (ou o armazenamento estiver corrompido). */
export function getSimulation(id: string): SimulationRecord | undefined {
  return readAll().find((record) => record.id === id);
}

/**
 * Guarda uma nova simulação e devolve o id gerado.
 *
 * O id sempre volta, mesmo quando a escrita falha: quem chama precisa de um
 * identificador para navegar, e uma exceção aqui derrubaria o fim do fluxo de
 * perguntas por causa de um problema de armazenamento, não de dado.
 */
export function saveSimulation(answers: Answers): string {
  const id = crypto.randomUUID();
  const record: SimulationRecord = {
    id,
    createdAt: new Date().toISOString(),
    answers,
  };

  const records = readAll();
  records.push(record);
  writeAll(records);

  return id;
}

/** Atualiza uma simulação existente. Devolve false se o id não existe ou a escrita falha. */
export function updateSimulation(id: string, patch: SimulationPatch): boolean {
  const records = readAll();
  const index = records.findIndex((record) => record.id === id);
  if (index === -1) {
    return false;
  }

  const current = records[index];
  if (!current) {
    return false;
  }
  records[index] = { ...current, ...patch };

  return writeAll(records);
}

/** Apaga uma simulação. Devolve false se o id não existe ou a escrita falha. */
export function deleteSimulation(id: string): boolean {
  const records = readAll();
  const remaining = records.filter((record) => record.id !== id);
  if (remaining.length === records.length) {
    return false;
  }

  return writeAll(remaining);
}

/**
 * Apaga tudo. Remove a chave em vez de gravar um array vazio: menos lixo no
 * armazenamento, e a leitura já sabe lidar com chave ausente.
 */
export function clearSimulations(): boolean {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
