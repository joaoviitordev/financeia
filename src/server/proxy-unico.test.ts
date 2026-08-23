// Spec da feature chave-no-servidor (T-023).
// Cada teste prova um critério de aceite; a tag @spec:AC-xxx no título é o
// que liga o teste à especificação em .spec/features/chave-no-servidor/.
import { describe, expect, it } from 'vitest';

/**
 * Os dois adaptadores do proxy, lidos como texto.
 *
 * Provar o AC-055 rodando um servidor de desenvolvimento de verdade custaria
 * caro e provaria pouco: o erro que interessa não é o proxy responder errado, é
 * alguém escrever um segundo proxy para o desenvolvimento e os dois divergirem
 * em silêncio. Isso se pega na origem, olhando de onde cada adaptador tira a
 * lógica.
 */
const ADAPTADORES: Record<string, string> = import.meta.glob(
  ['/api/gemini.ts', '/vite.config.ts'],
  { query: '?raw', import: 'default', eager: true },
);

const MODULO_DO_PROXY = 'src/server/gemini-proxy';
const FUNCAO_DO_PROXY = 'handleGeminiRequest';

/** Sinais de que alguém reescreveu a lógica em vez de chamá-la. */
const LOGICA_DUPLICADA = [
  ['generativelanguage', 'googleapis', 'com'].join('.'),
  ['x', 'goog', 'api', 'key'].join('-'),
];

describe('o proxy é um só', () => {
  // US-019 — Desenvolvimento e produção falam a mesma língua
  it('AC-055: O servidor de desenvolvimento serve o mesmo proxy @spec:AC-055', () => {
    const caminhos = Object.keys(ADAPTADORES);

    // Os dois adaptadores existem: a função publicada e o servidor de dev.
    expect(caminhos).toContain('/api/gemini.ts');
    expect(caminhos).toContain('/vite.config.ts');

    for (const [caminho, conteudo] of Object.entries(ADAPTADORES)) {
      // Cada um chama o MESMO módulo...
      expect(conteudo, `${caminho} deveria importar o proxy`).toContain(MODULO_DO_PROXY);
      expect(conteudo, `${caminho} deveria chamar o proxy`).toContain(FUNCAO_DO_PROXY);

      // ...e nenhum reescreve a lógica por conta própria.
      for (const sinal of LOGICA_DUPLICADA) {
        expect(conteudo, `${caminho} tem lógica de proxy própria (${sinal})`).not.toContain(sinal);
      }
    }
  });

  // A chave é lida em cada adaptador, e sempre sem o prefixo que a embutiria.
  it('os dois adaptadores leem a chave sem prefixo VITE_', () => {
    const proibido = ['VITE', 'GEMINI', 'API', 'KEY'].join('_');

    for (const [caminho, conteudo] of Object.entries(ADAPTADORES)) {
      expect(conteudo, `${caminho} deveria ler GEMINI_API_KEY`).toContain('GEMINI_API_KEY');
      expect(conteudo, `${caminho} voltou a usar o prefixo VITE_`).not.toContain(proibido);
    }
  });
});
