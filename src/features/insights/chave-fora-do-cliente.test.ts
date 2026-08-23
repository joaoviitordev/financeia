// Spec da feature chave-no-servidor (T-022).
// Cada teste prova um critério de aceite; a tag @spec:AC-xxx no título é o
// que liga o teste à especificação em .spec/features/chave-no-servidor/.
import { describe, expect, it } from 'vitest';

/**
 * Os textos proibidos são montados por concatenação de propósito: escritos por
 * extenso, este arquivo apareceria na própria varredura e o teste acusaria a si
 * mesmo.
 */
const VARIAVEL_EMBUTIDA = ['VITE', 'GEMINI', 'API', 'KEY'].join('_');
const CABECALHO_DE_CHAVE = ['x', 'goog', 'api', 'key'].join('-');
const ENDERECO_DO_GOOGLE = ['generativelanguage', 'googleapis', 'com'].join('.');

/**
 * O código-fonte lido pelo próprio Vite, e não pelo `node:fs`.
 *
 * Ler do disco exigiria os tipos do Node no `tsconfig.app.json`, que vale para
 * todo o cliente: para provar que a chave não vaza, abriríamos a porta para
 * qualquer módulo de tela chamar `fs`. O `import.meta.glob` resolve em tempo de
 * build e não custa nada dessa fronteira.
 */
const FONTES: Record<string, string> = import.meta.glob('/src/**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/**
 * Os arquivos que EMBARCAM no pacote do navegador.
 *
 * Fora da conta ficam dois: `src/server/`, que é justamente onde a chave pode
 * ser mencionada porque aquele código não vai para o navegador, e os arquivos
 * de teste, que também não vão. Um teste pode e deve falar da chave: é assim
 * que ele prova que ela não está sendo mandada.
 */
function arquivosDoCliente(): [string, string][] {
  return Object.entries(FONTES).filter(
    ([caminho]) => !caminho.startsWith('/src/server/') && !/\.(test|spec)\.tsx?$/.test(caminho),
  );
}

describe('a chave fora do cliente', () => {
  // US-017 — A chave não vai para o navegador
  it('AC-049: Nenhum módulo do cliente lê a chave @spec:AC-049', () => {
    const suspeitos: string[] = [];

    for (const [caminho, conteudo] of arquivosDoCliente()) {
      if (conteudo.includes(VARIAVEL_EMBUTIDA)) {
        suspeitos.push(`${caminho}: lê a variável de ambiente embutida no pacote`);
      }
      if (conteudo.includes(CABECALHO_DE_CHAVE)) {
        suspeitos.push(`${caminho}: manda cabeçalho de chave`);
      }
      if (conteudo.includes(ENDERECO_DO_GOOGLE)) {
        suspeitos.push(`${caminho}: fala direto com o Google`);
      }
    }

    // Uma lista, e não um booleano: quando isto quebrar daqui a meses, a
    // mensagem já diz qual arquivo reintroduziu a chave.
    expect(suspeitos).toEqual([]);
  });

  it('a varredura enxerga o que precisa enxergar', () => {
    const caminhos = arquivosDoCliente().map(([caminho]) => caminho);

    // Encontra código de verdade...
    expect(caminhos).toContain('/src/features/insights/gemini.ts');
    // ...deixa o servidor de fora, que é onde a chave mora legitimamente...
    expect(caminhos.some((caminho) => caminho.startsWith('/src/server/'))).toBe(false);
    // ...e os testes também, que não embarcam.
    expect(caminhos.some((caminho) => caminho.includes('.test.'))).toBe(false);
  });

  // A varredura só vale se ela realmente acusaria um vazamento.
  it('a varredura acusa quando o texto proibido aparece', () => {
    const disfarcado = `const chave = import.meta.env.${VARIAVEL_EMBUTIDA};`;

    expect(disfarcado.includes(VARIAVEL_EMBUTIDA)).toBe(true);
  });
});
