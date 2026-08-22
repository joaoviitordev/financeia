# Tasks: Diagnóstico com IA

> feature: diagnostico-ia

<!--
  Ordem do arquivo = ordem de dependência: cada tarefa só importa o que as
  anteriores já criaram. T-006 e T-007 não dependem de ninguém.
  Status: pendente | em-andamento | concluida
-->

## T-006 — Contrato do diagnóstico, viabilidade e prompt [concluida]

- Refs: US-006, AC-017, AC-018
- Arquivos: src/features/insights/types.ts, src/features/insights/feasibility.ts, src/features/insights/feasibility.test.ts, src/features/insights/prompt.ts, src/features/insights/prompt.test.ts
- Modelo: claude-sonnet-5
- Esforço: alto
- Notas: base de todas as outras — cria o `InsightData` (viabilidade, diagnóstico, sugestões, renda extra, investimentos, mensagem final) que o resto importa. A viabilidade é função pura dos números do `Plan`, em `feasibility.ts`, e não da resposta da IA (ASM-010): viável com saldo após reserva ≥ 0, ajuste necessário até 20% negativo da economia mensal necessária, inviável acima disso — as três faixas e as duas bordas exatas viram teste. O `buildInsightPrompt` recebe os valores já calculados por `buildPlan`, nunca pede conta à IA, e leva papel, contexto de exibição, dados rotulados, formato JSON, schema literal e regras. Teste de snapshot no prompt: ele é a interface com a IA, e mudança silenciosa ali é regressão de produto.

## T-007 — Chave da API e ambiente [concluida]

- Refs: US-007
- Arquivos: .env.example, src/env.d.ts, src/features/insights/config.ts, src/features/insights/config.test.ts, README.md
- Modelo: claude-sonnet-5
- Esforço: baixo
- Notas: não depende de nenhuma outra tarefa. `.env.example` versionado com a chave vazia; `.env.local` é do dono do projeto e o `.gitignore` já cobre. `src/env.d.ts` declara `VITE_GEMINI_API_KEY` — sem isso o `noPropertyAccessFromIndexSignature` recusa o acesso. `config.ts` expõe a chave como `string | null` (vazia ou ausente é null) para o painel poder avisar em vez de tentar a rede (AC-022). Uma linha no README dizendo que sem a chave o app roda e o diagnóstico não é gerado. Nenhum segredo entra no repositório.

## T-008 — Serviço do Gemini e leitura da resposta [concluida]

- Refs: US-008, AC-025
- Arquivos: src/features/insights/gemini.ts, src/features/insights/gemini.test.ts
- Modelo: claude-sonnet-5
- Esforço: alto
- Notas: depende de T-006 (tipos) e T-007 (chave). HTTP puro, sem React. `POST` para `generativelanguage.googleapis.com/v1beta/models/<modelo>:generateContent` com a chave no header `x-goog-api-key` (fora da URL e dos logs de proxy) e `generationConfig.responseMimeType: 'application/json'`. Nada de cast sobre o `JSON.parse`: `parseInsight(raw: unknown): InsightData | null` confere as seis chaves e os tipos, e o `null` é erro de geração. Remova a cerca de código antes de ler — o mime type reduz, mas não elimina. Erros distintos, mensagens distintas: 401/403 chave inválida, 429 cota, 5xx e falha de rede tentam de novo, JSON inválido é resposta inesperada. Testes com `vi.stubGlobal('fetch', …)`; nenhum teste encosta na API de verdade.

## T-009 — O diagnóstico guardado junto da simulação [concluida]

- Refs: US-008
- Arquivos: src/features/simulations/storage.ts, src/features/simulations/storage.test.ts
- Modelo: claude-sonnet-5
- Esforço: medio
- Notas: depende de T-006 (tipos). O registro ganha um `insight` opcional e o `SimulationPatch` passa a aceitá-lo, inclusive para apagá-lo. Registro guardado antes desta mudança (sem o campo) continua válido na leitura — o validador não pode passar a descartar simulação antiga. Diagnóstico corrompido no armazenamento derruba só o diagnóstico daquele registro, nunca a lista inteira.

## T-010 — Hook do diagnóstico, com cache e trava [concluida]

- Refs: US-008, AC-023, AC-024
- Arquivos: src/features/insights/useInsight.ts, src/features/insights/useInsight.test.tsx
- Modelo: claude-sonnet-5
- Esforço: alto
- Notas: depende de T-006, T-007, T-008 e T-009. `useInsight(id)` devolve `{ insight, isLoading, error, retry }`, inicializa do registro guardado (se já existe diagnóstico, não chama a API — é o que faz reabrir sair de graça, AC-024), usa um `useRef` como trava de requisição em voo para o StrictMode não pagar duas chamadas (AC-023), grava com `updateSimulation` ao terminar e o `retry` limpa o erro e refaz ignorando o cache. Sem chave, nem tenta a rede: devolve o estado de "falta configurar".

## T-011 — Concluir de novo descarta o diagnóstico velho [concluida]

- Refs: US-008, AC-026
- Arquivos: src/features/onboarding/useOnboarding.ts, src/features/insights/reconclusao.test.tsx
- Modelo: claude-sonnet-5
- Esforço: baixo
- Notas: depende de T-009. Hoje voltar do resumo e confirmar de novo corrige as respostas da mesma simulação; o diagnóstico guardado precisa ir junto, senão o texto contradiz os números na mesma tela (ASM-012). Uma linha no `updateSimulation` já existente — o hook continua sem conhecer rotas nem IA.

## T-012 — O diagnóstico na tela [concluida]

- Refs: US-005, AC-013, AC-014, AC-015, AC-016
- Arquivos: src/features/insights/InsightContent.tsx, src/features/insights/InsightContent.test.tsx
- Modelo: claude-sonnet-5
- Esforço: alto
- Notas: depende de T-006 (tipos). Seis seções na ordem da especificação, listas como `<ol>`, títulos `text-headline text-label` e parágrafos `text-body text-label-secondary`. O selo de viabilidade usa os tokens de status (`--status-good`, `--status-warning`, `--status-critical`) e carrega rótulo em texto — nunca só cor, pela mesma razão do `StatTile`. Viabilidade desconhecida cai em fallback neutro sem selo, jamais em `undefined.className`. Lista vazia não renderiza o título da seção.

## T-013 — Esqueleto, carregando, erro e o painel na página [concluida]

- Refs: US-007, AC-019, AC-020, AC-021, AC-022
- Arquivos: src/components/ui/Skeleton.tsx, src/components/ui/Skeleton.test.tsx, src/features/insights/InsightPanel.tsx, src/features/insights/InsightPanel.test.tsx, src/routes/ResultPage.tsx
- Modelo: claude-sonnet-5
- Esforço: alto
- Notas: última — depende de T-010 (hook) e T-012 (conteúdo). `Skeleton` próprio com `bg-fill-tertiary`, `rounded-lg` e `animate-pulse` (o `prefers-reduced-motion` já é global no base.css), com `lines` e `className`; nada de dependência nova. O `InsightPanel` escolhe entre carregando, erro, falta de chave e conteúdo — estados mutuamente exclusivos, nunca dois na tela (AC-021). Carregando mostra o cabeçalho "Insight financeiro personalizado" desde o início, para o conteúdo não empurrar o layout quando chegar, com `aria-busy` e `role="status"` para quem usa leitor de tela. Erro em `text-critical`, com ícone e botão "Tentar novamente" ligado ao `retry`. Na `ResultPage`, o placeholder do painel some e entra o `InsightPanel`.
