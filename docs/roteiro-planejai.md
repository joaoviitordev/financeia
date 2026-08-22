# Roteiro: levar o Finance IA à paridade com o Planej.ai

Referência: [README do Planej.ai (DIO)](https://github.com/digitalinnovationone/planejai/blob/main/README.md) — 23 aulas em 3 blocos, mais 2 desafios.

Este documento **não é uma tradução do README de lá**. Ele é o caminho daqui até lá, partindo do
que este projeto já tem. A regra que orienta tudo: **nada do que já está pronto é reescrito.**
O design system, o fluxo de onboarding, as ferramentas de qualidade e os testes ficam como estão;
cada etapa abaixo é aditiva.

Onde uma etapa precisa encostar em arquivo existente, ele aparece marcado com **✏️** e o roteiro
diz exatamente qual é a alteração mínima. Se um passo parecer pedir mais do que isso, é sinal de
que ele foi mal entendido — pare e reveja.

---

## 1. O que o Planej.ai faz

Aplicação de planejamento financeiro pessoal, 100% no navegador. A pessoa responde um formulário
multi-step sobre renda, gastos e uma meta; os dados vão para o `localStorage`; a página de
resultado manda esses dados para a API do Google Gemini e exibe um diagnóstico financeiro
personalizado (viabilidade, diagnóstico, sugestões, renda extra, investimento, mensagem final).

Sem backend, sem banco. A chave da API vive no `.env.local` e a chamada sai do próprio cliente.

---

## 2. Tabela de tradução (decisões já tomadas)

O README de lá assume um projeto que começa do zero. O nosso já tem opinião formada em várias
dessas escolhas. Onde há conflito, **vence o que já existe aqui** — o objetivo é paridade de
funcionalidade, não de código.

| Planej.ai                                         | Aqui                                              | Por quê                                                                                                                    |
| ------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `pnpm add …`                                      | `npm install …`                                   | O lockfile do projeto é do npm.                                                                                            |
| `src/styles/theme.css` (`--primary`, `--card`, …) | `src/styles/tokens/*.css`                         | Já temos um sistema de tokens completo. **Não copie o `theme.css` de lá** — criaria dois vocabulários de cor concorrentes. |
| `bg-card`, `text-muted-foreground`, `bg-primary`  | `bg-surface`, `text-label-secondary`, `bg-accent` | Mesma ideia, nomes diferentes. Traduza ao portar qualquer JSX do README.                                                   |
| `shadow-[4px_4px_18px_…]` solto no JSX            | `<Card>` / `<CardBody>`                           | A elevação já está encapsulada.                                                                                            |
| `components/shared/Button`, `Input`, `Divider`    | `components/ui/Button`, `Field`, `Separator`      | Já existem, com foco, contraste e dark mode resolvidos.                                                                    |
| `components/features/Simulation/…`                | `src/features/<domínio>/…`                        | Convenção de pastas já em uso em `src/features/onboarding/`.                                                               |
| `@fontsource/inter`                               | stack de fonte do sistema                         | Decisão registrada no README do projeto. Não instale o Inter.                                                              |
| `react-loading-skeleton`                          | `components/ui/Skeleton` próprio (etapa 8)        | Uma dependência a menos e o skeleton nasce falando os nossos tokens nos dois temas.                                        |
| `useTheme` / `ThemeProvider` (aula 08)            | `src/theme/` — **já pronto**                      | Inclusive com anti-flash no `index.html`, que a versão de lá não tem.                                                      |
| `crypto.randomUUID()`                             | igual                                             | Disponível em contexto seguro (localhost conta).                                                                           |
| ids em inglês (`income`, `goalAmount`)            | ids em pt (`renda`, `custoObjetivo`)              | Coerência com `questions.ts`. O prompt para a IA continua descrevendo os campos em português.                              |

Convenções nossas que valem para todo código novo: ponto e vírgula, aspas simples, import por
alias `@/`, `any` proibido, `!` proibido, e `String(n)` em template literal com número (a regra
`restrict-template-expressions` reclama sem isso — veja `GoalsSummary.tsx`).

---

## 3. Paridade: onde estamos

| Capacidade                                 | Aula (lá)  | Estado aqui                                                            | Etapa   |
| ------------------------------------------ | ---------- | ---------------------------------------------------------------------- | ------- |
| Vite + React + TS, ESLint, Prettier, alias | 02         | ✅ pronto (e com Vitest, Husky, commitlint, que lá não existem)        | —       |
| Tailwind v4 via plugin do Vite             | 03         | ✅ pronto                                                              | —       |
| Variáveis de tema e estilos globais        | 04         | ✅ pronto, mais completo (`src/styles/tokens/`)                        | —       |
| Tema claro/escuro com provider e hook      | 08         | ✅ pronto (`src/theme/`)                                               | —       |
| `Button`, `Input`, `Divider`, `PageHero`   | 06, 11, 16 | ✅ equivalentes em `components/ui/`                                    | —       |
| Cabeçalho e navegação                      | 07         | ✅ `components/layout/Header.tsx`                                      | —       |
| Barra de progresso do formulário           | 10         | ✅ `components/ui/ProgressBar.tsx`, usada no `QuestionStep`            | —       |
| Formulário multi-step com avançar/voltar   | 09, 13     | ✅ `useOnboarding` (máquina de estados, melhor que o `useState` de lá) | —       |
| Máscara de moeda                           | 14         | ✅ `lib/format.ts` (`maskCurrencyInput` / `parseCurrencyInput`)        | —       |
| Rotas com React Router                     | 05         | ❌ dependência instalada, nunca usada                                  | **E1**  |
| Campos de dívidas e prazo da meta          | 12         | ❌ temos 5 perguntas, faltam 2                                         | **E2**  |
| Persistência no `localStorage` + id único  | 15, 17     | ❌ hoje o estado morre ao recarregar                                   | **E3**  |
| Página de resultado com cards              | 16         | ⚠️ temos `GoalsSummary`, falta a rota `/resultado/:id`                 | **E4**  |
| Prompt para a IA                           | 18         | ❌                                                                     | **E5**  |
| Chave de API do Gemini                     | 19         | ❌                                                                     | **E6**  |
| Chamada HTTP ao Gemini                     | 20         | ❌                                                                     | **E7**  |
| Deduplicação de chamadas + cache           | 21         | ❌                                                                     | **E7**  |
| Skeleton de carregamento e estado de erro  | 22         | ❌                                                                     | **E8**  |
| Exibição do diagnóstico                    | 23         | ❌                                                                     | **E9**  |
| Histórico de simulações                    | Desafio 1  | ⚠️ existe o `Sheet` com estado vazio, sem dados                        | **E10** |
| Chat com o educador financeiro             | Desafio 2  | ❌                                                                     | **E11** |

Resumo: os blocos 1 e 2 do curso estão essencialmente feitos (e em alguns pontos ultrapassados).
O trabalho real é o **bloco 3 inteiro** — persistência, rota de resultado e integração com IA.

---

## 4. Ordem de execução

```
E1 rotas ──► E2 perguntas ──► E3 storage ──► E4 página de resultado ──┐
                                                                      ├─► E9 exibição ──► E10 histórico ──► E11 chat
        E5 prompt ──► E6 chave ──► E7 serviço + hook ──► E8 estados ──┘
```

E5 e E6 não dependem de E1–E4 e podem ser feitas em paralelo. E7 depende de E3 (precisa ler a
simulação salva) e de E5/E6.

Cada etapa fecha com `npm run validate` verde e um commit em Conventional Commits.

---

## E1 — Rotas com React Router

**Referência:** aulas 05, 09 e 17. `react-router-dom@^7` **já está no `package.json`** — não
instale nada.

Hoje o `App.tsx` renderiza o `Onboarding` direto. Precisamos de três endereços: o formulário, o
resultado de uma simulação específica e o histórico.

**Arquivos**

- `src/router.tsx` — novo
- `src/routes/SimulationPage.tsx` — novo (casca que renderiza `<Onboarding />`)
- ✏️ `src/App.tsx` — vira o layout raiz
- ✏️ `src/main.tsx` — troca `<App />` por `<RouterProvider router={router} />`

**Passos**

1. Crie `src/router.tsx` com `createBrowserRouter`, tendo `App` como `element` da rota raiz e as
   filhas `/` (formulário), `/resultado/:id` e `/historico`. Deixe as duas últimas apontando para
   um componente provisório; elas ganham conteúdo em E4 e E10.
2. No `App.tsx`, a **única** mudança é dentro do `<main>`: `<Onboarding key={simulation} />` sai e
   entra `<Outlet />`. Header, Footer e o `Sheet` de histórico continuam exatamente onde estão —
   é justamente por morarem no layout que eles aparecem em todas as rotas.
3. O botão "nova simulação" do Header passa a chamar `void navigate('/')`. O contador `simulation`
   existia só para remontar o fluxo; com rotas, use `key={location.key}` no `<Onboarding />` dentro
   da `SimulationPage` — a `key` do `location` muda a cada navegação, inclusive de `/` para `/`,
   que é exatamente o comportamento que o contador dava.
4. Em `main.tsx`, o `ThemeProvider` continua por fora do `RouterProvider`.

**Aceite**

- `/` mostra o onboarding como antes.
- Clicar em "nova simulação" no meio do fluxo devolve à apresentação com as respostas limpas.
- `/resultado/123` e `/historico` renderizam sem quebrar.
- Header e Footer aparecem nas três rotas.

**Testes** — `src/App.test.tsx` renderiza `<App />` direto; ✏️ envolva-o em `<MemoryRouter>` (ou
use `createMemoryRouter` + `RouterProvider`). Isso é ajuste de setup, não mudança de expectativa.

**Commit:** `feat(router): adiciona rotas de simulação, resultado e histórico`

---

## E2 — As duas perguntas que faltam

**Referência:** aula 12.

O Planej.ai coleta: renda, custos fixos, **dívidas/parcelas**, nome da meta, custo da meta e
**prazo em meses**. Nós coletamos renda, gastos fixos, quanto já está guardado, objetivo e custo
do objetivo. Faltam duas — e a nossa pergunta de reserva não existe lá, mas fica: ela alimenta o
cálculo da reserva de emergência em `goals.ts`, que é um diferencial nosso.

Resultado: **sete perguntas**.

**Arquivos**

- ✏️ `src/features/onboarding/questions.ts` — dois itens novos em `QUESTIONS`, dois ids novos em
  `QuestionId` e em `EMPTY_ANSWERS`
- ✏️ `src/features/onboarding/fields/types.ts` — `FieldKind` ganha `'months'`
- ✏️ `src/features/onboarding/fields/registry.ts` — entrada `months`
- ✏️ `src/components/ui/Field.tsx` — novo `MonthsField` exportado (os existentes não mudam)
- ✏️ `src/features/onboarding/answers-to-plan.ts` e `goals.ts` — os dois campos entram no cálculo

**Passos**

1. `dividas` — kind `currency`, ícone `Landmark`, pergunta: "Você tem algum valor comprometido com
   parcelas ou empréstimos todo mês?". Diferente das outras respostas monetárias, **zero é uma
   resposta legítima** aqui. Como `isComplete` do kind `currency` exige `> 0`, ou você cria um kind
   próprio que aceita zero, ou põe um botão "não tenho dívidas" que preenche `0`. Escolha uma das
   duas e registre a decisão em comentário — quem ler depois vai se perguntar por que este campo é
   diferente.
2. `prazoObjetivo` — kind `months`, ícone `CalendarClock`, pergunta: "Em quantos meses você quer
   chegar lá?", faixa de 1 a 120.
3. No registry, `months` recebe: `normalize` que descarta tudo que não é dígito e corta em 3
   caracteres; `isComplete` que aceita 1–120. Repare que a extensão é exatamente a que o comentário
   do `registry.ts` antecipa — nenhum componente de tela precisa ser tocado.
4. `MonthsField` é o `TextField` com sufixo "meses" e `inputMode="numeric"`. Siga o padrão dos
   outros: `useId`, label `sr-only`, `FIELD_SHELL`/`FIELD_INPUT` reaproveitados.
5. `toPlanInput` passa a devolver `debts` e `goalMonths`; em `goals.ts`, a sobra mensal vira
   `income - fixedCosts - debts` e o plano ganha o prazo desejado ao lado do prazo calculado — é
   o confronto entre os dois que a IA vai analisar na E5.

**Aceite**

- O fluxo mostra "Passo 1 de 7"; a barra de progresso acompanha.
- Voltar de qualquer passo preserva o que já foi digitado.
- Com dívidas preenchidas, a sobra mensal do resumo diminui na mesma proporção.

**Testes** — ✏️ `goals.test.ts` e `Onboarding.test.tsx` já contam passos e conferem contas;
atualize os números e acrescente um caso de dívida > 0 e um de prazo inválido (0 e 121 não avançam).

**Commit:** `feat(onboarding): coleta dívidas mensais e prazo da meta`

---

## E3 — Persistência no localStorage com id único

**Referência:** aulas 15 e 17.

Sem isto, `/resultado/:id` não tem o que ler. Hoje o `Sheet` de histórico exibe, corretamente,
que nada é gravado — esse texto sai nesta etapa.

**Arquivos**

- `src/features/simulations/storage.ts` — novo (funções puras)
- `src/features/simulations/useSimulations.ts` — novo (hook)
- `src/features/simulations/storage.test.ts` — novo
- ✏️ `src/features/onboarding/useOnboarding.ts` — salva ao concluir e devolve o id
- ✏️ `src/App.tsx` — o texto do estado vazio do `Sheet` deixa de dizer que nada é salvo

**Modelo de dados**

```ts
export interface SimulationRecord {
  id: string;
  createdAt: string; // ISO. Ordena o histórico e sobrevive ao JSON.
  answers: Answers;
  insight?: InsightData; // preenchido na E7; evita repetir a chamada à IA
}
```

Guardar `answers` aninhado, e não espalhado na raiz como o README faz, é o que permite acrescentar
campos de controle depois sem colidir com um id de pergunta.

**Passos**

1. `storage.ts` expõe `listSimulations()`, `getSimulation(id)`, `saveSimulation(answers): string`
   (gera `crypto.randomUUID()` e devolve o id), `updateSimulation(id, patch)` e
   `deleteSimulation(id)`. Chave: `financeia:simulations:v1` — o sufixo de versão evita ter que
   adivinhar formato antigo no dia em que o schema mudar.
2. **Trate `localStorage` como hostil.** O JSON pode estar corrompido, a quota pode estourar, o
   modo privado de alguns navegadores lança na escrita. Toda leitura passa por `try/catch` e
   devolve lista vazia; toda escrita falha devolvendo `false`, nunca derruba a tela. Nada de
   `as SimulationRecord[]` cru sobre o resultado do `JSON.parse`: valide que é array e que cada
   item tem `id` string (lembre que `any` e `!` são erro de lint aqui).
3. O hook `useSimulations` embrulha as funções com `useCallback` e mantém a lista em `useState`
   para o histórico re-renderizar depois de excluir.
4. Em `useOnboarding`, o `next()` do último passo salva e devolve o id. Como o hook não conhece
   rotas, quem navega é a tela: a `SimulationPage` chama ``navigate(`/resultado/${id}`)``.

**Aceite**

- Concluir o fluxo grava um registro e leva para `/resultado/<uuid>`.
- Recarregar a página e abrir a mesma URL ainda mostra a simulação.
- Com `localStorage` cheio ou com lixo na chave, o app abre normalmente.

**Testes** — em `beforeEach`, `localStorage.clear()`. Cubra: salvar e reler; id único entre duas
simulações; JSON corrompido devolvendo lista vazia; excluir removendo só o alvo.

**Commit:** `feat(simulations): persiste simulações no localStorage com id único`

---

## E4 — Página de resultado

**Referência:** aula 16.

**Arquivos**

- `src/routes/ResultPage.tsx` — novo
- `src/features/simulations/SimulationCards.tsx` — novo
- ✏️ `src/router.tsx` — `/resultado/:id` aponta para a página real

**Passos**

1. `ResultPage` lê o `id` com `useParams`, busca via `getSimulation` e, quando não encontra,
   mostra um estado vazio honesto com link para `/` — não uma tela em branco. Esse caso acontece
   de verdade: link antigo, `localStorage` limpo, outro navegador.
2. Os seis cards do layout de referência (custo da meta, prazo, economia mensal em destaque,
   renda, custos fixos, dívidas) saem do `StatTile` e do `Card` que já existem. **Não crie o
   `Card` com `variantClasses` da aula 16** — é o nosso `Card`, com uma variante de destaque se
   necessário.
3. Reaproveite `buildPlan` para os números derivados. O README de lá recalcula tudo à mão em
   `utils/simulation.ts`; aqui a conta já existe, é testada, e duplicá-la garantiria divergência
   entre a tela e o prompt mais cedo ou mais tarde.
4. Reserve o espaço do painel de insights (o `lg:col-span-2` do grid) com um placeholder. Ele é
   preenchido em E8/E9.

**Aceite**

- `/resultado/<id>` mostra os valores da simulação formatados em BRL.
- `/resultado/inexistente` mostra o estado vazio com saída para `/`.
- Layout responde: uma coluna no mobile, três no desktop.

**Commit:** `feat(result): exibe a página de resultado da simulação`

---

## E5 — O prompt

**Referência:** aula 18 — a aula mais importante do bloco 3. A qualidade da resposta é
consequência direta da qualidade do prompt.

**Arquivos**

- `src/features/insights/types.ts` — novo
- `src/features/insights/prompt.ts` — novo
- `src/features/insights/prompt.test.ts` — novo

**Formato de resposta** (contrato entre prompt e código — os dois lados mudam juntos):

```ts
export interface InsightData {
  feasibility: { status: 'viable' | 'needs_adjustment' | 'unfeasible'; content: string };
  diagnosis: { content: string };
  suggestions: { items: string[] };
  extraIncome: { items: string[] };
  investment: { items: string[] };
  motivation: { content: string };
}
```

**Passos**

1. `buildInsightPrompt(record: SimulationRecord): string` monta o texto com sete elementos, todos
   necessários: **papel** ("educador financeiro especializado em finanças pessoais"); **contexto de
   exibição** (o texto vai direto para a tela, segunda pessoa, sem markdown); **dados rotulados**;
   **valores já calculados** — sobra mensal, economia mensal necessária (custo ÷ prazo) e saldo
   depois da reserva; **formato de saída** (JSON e nada mais); **schema** literal; **regras**
   (pt-BR, no máximo 4 itens por lista, sem repetir informação entre seções, sem markdown dentro
   dos valores).
2. Passe os números **já calculados** por `buildPlan`. Se a IA refizer a conta, ela vai divergir
   dos cards que a pessoa está vendo na mesma tela — e é a IA que vai parecer errada.
3. `feasibility.status` precisa de critério objetivo, nunca de julgamento da IA: `viable` = saldo
   após a reserva ≥ 0; `needs_adjustment` = saldo negativo até 20% da economia necessária;
   `unfeasible` = negativo acima disso.

**Aceite** — o prompt contém todos os valores da simulação e o schema; trocar um valor da
simulação muda o prompt.

**Testes** — snapshot do prompt para uma simulação fixa. Ele é a interface com a IA; mudança
silenciosa ali é regressão de produto, e o snapshot obriga a mudança a passar por revisão.

**Commit:** `feat(insights): monta o prompt do diagnóstico financeiro`

---

## E6 — Chave da API do Gemini

**Referência:** aula 19.

**Passos**

1. Em [aistudio.google.com](https://aistudio.google.com/) → **Get API Key** → criar chave.
2. `.env.local` na raiz (já coberto pelo `.gitignore`, que ignora `.env.*` e libera só
   `.env.example`):

   ```
   VITE_GEMINI_API_KEY=sua_chave_aqui
   ```

3. Crie `.env.example` com a chave **vazia**, versionado, para quem clonar saber o que precisa.
4. Crie `src/env.d.ts` declarando a variável. Sem isso o `noPropertyAccessFromIndexSignature`
   rejeita `import.meta.env.VITE_GEMINI_API_KEY`:

   ```ts
   interface ImportMetaEnv {
     readonly VITE_GEMINI_API_KEY: string;
   }
   interface ImportMeta {
     readonly env: ImportMetaEnv;
   }
   ```

5. ✏️ Uma linha no README do projeto explicando que sem a chave o app roda, mas o diagnóstico não
   é gerado.

> **Segurança — leia antes de publicar.** Tudo com prefixo `VITE_` **vai para o bundle**. Qualquer
> pessoa com acesso ao site lê a chave no DevTools. Para um projeto de estudo rodando local, é o
> trade-off aceito pelo curso. Para qualquer deploy público: restrinja a chave por referrer no
> console do Google, ponha limite de cota, e mova a chamada para um proxy (função serverless) que
> guarde a chave do lado do servidor. Não é paranoia — chave de LLM exposta vira conta paga por
> terceiros em questão de dias.

**Aceite** — `import.meta.env.VITE_GEMINI_API_KEY` tipado, `npm run typecheck` verde, `.env.local`
fora do `git status`.

**Commit:** `chore(env): configura a chave da API do Gemini`

---

## E7 — Serviço, hook e cache

**Referência:** aulas 20 e 21.

**Arquivos**

- `src/features/insights/gemini.ts` — novo (HTTP puro, sem React)
- `src/features/insights/useInsight.ts` — novo
- `src/features/insights/gemini.test.ts` — novo

**Passos**

1. `gemini.ts` faz `POST` para
   `https://generativelanguage.googleapis.com/v1beta/models/<MODELO>:generateContent`, corpo
   `{ contents: [{ parts: [{ text: prompt }] }] }`. O README usa a chave na query string; prefira
   o header `x-goog-api-key`, que mantém a chave fora de URLs e de logs de proxy. O modelo do
   README é `gemini-flash-latest`; se o alias não responder, fixe um modelo explícito da lista do
   AI Studio.
2. Acrescente `generationConfig: { responseMimeType: 'application/json' }`. Reduz muito a chance
   de a resposta vir embrulhada em cerca de código markdown — mas **não elimina**. Mantenha um
   passo de limpeza que remove as cercas antes do `JSON.parse`.
3. **Nada de `as InsightData` sobre o `JSON.parse`.** A resposta vem de um modelo probabilístico:
   escreva `parseInsight(raw: unknown): InsightData | null` conferindo as seis chaves e os tipos,
   e trate o `null` como erro de geração. É a diferença entre "tente novamente" e uma tela branca
   com `Cannot read properties of undefined`.
4. Erros distintos merecem mensagens distintas: 401/403 (chave inválida), 429 (cota estourada),
   5xx e falha de rede (tente novamente), JSON inválido (resposta inesperada). Uma mensagem única
   para tudo transforma um problema de configuração em mistério.
5. `useInsight(id)` devolve `{ insight, isLoading, error, retry }` e:
   - **inicializa o estado a partir do registro salvo** — se `record.insight` existe, não chama
     a API. Esse é o cache da aula 21, e é ele que faz o histórico abrir de graça;
   - usa um `useRef` como trava de requisição em voo. O StrictMode do React renderiza duas vezes
     em desenvolvimento e, sem a trava, você paga duas chamadas por simulação;
   - grava o resultado com `updateSimulation(id, { insight })` ao terminar;
   - `retry` limpa o erro e refaz a chamada, ignorando o cache.

**Aceite**

- Concluir uma simulação dispara **uma** requisição (confira na aba Network, em dev, com
  StrictMode ligado).
- Recarregar `/resultado/:id` exibe o diagnóstico salvo sem nova requisição.
- Chave inválida produz mensagem de chave inválida, não "erro genérico".

**Testes** — `vi.stubGlobal('fetch', …)`. Cubra: resposta boa; JSON com cerca de código; JSON
inválido; 429; falha de rede. Nenhum teste pode encostar na API de verdade.

**Commit:** `feat(insights): integra a API do Gemini com cache por simulação`

---

## E8 — Carregando e erro

**Referência:** aula 22.

**Arquivos**

- `src/components/ui/Skeleton.tsx` — novo
- `src/features/insights/InsightPanel.tsx` — novo
- ✏️ `src/routes/ResultPage.tsx` — o placeholder do painel vira o `InsightPanel`

**Passos**

1. `Skeleton` próprio: `bg-fill-tertiary`, `rounded-lg`, pulso via `animate-pulse`. O
   `prefers-reduced-motion` já é respeitado globalmente pelo `base.css`. Props úteis: `lines`,
   `className`. Isso substitui o `react-loading-skeleton` da aula, sem dependência nova e falando
   os nossos tokens nos dois temas.
2. `InsightPanel` decide entre três estados **mutuamente exclusivos** — carregando, erro,
   conteúdo. Não deixe erro e conteúdo aparecerem juntos.
3. Estado de carregando: 8 a 10 linhas de skeleton com larguras variadas, mais o cabeçalho
   "✨ Insight financeiro personalizado" já visível — ele não depende da resposta, e mostrá-lo
   desde o início evita o pulo de layout quando o conteúdo chega.
4. Estado de erro: mensagem em `text-critical`, ícone, e botão "Tentar novamente" ligado ao
   `retry`.
5. Acessibilidade: o container recebe `aria-busy` enquanto carrega e `role="status"` para o leitor
   de tela anunciar a chegada do diagnóstico. Quem usa leitor de tela não vê o skeleton.

**Aceite** — com a rede em throttle o skeleton aparece; com a chave errada aparece o erro e o
botão refaz a chamada; nunca há dois estados na tela ao mesmo tempo.

**Commit:** `feat(insights): trata carregamento e erro do diagnóstico`

---

## E9 — Exibir o diagnóstico

**Referência:** aula 23.

**Arquivos**

- `src/features/insights/InsightContent.tsx` — novo
- `src/features/insights/InsightContent.test.tsx` — novo

**Passos**

1. Seis seções, na ordem: 🎯 Viabilidade (com selo de status), 💰 Diagnóstico, 📋 Sugestões,
   💡 Renda extra, 🏦 Investimentos, 🚀 Mensagem final. Listas como `<ol>`; parágrafos com
   `text-body text-label-secondary`; títulos com `text-headline text-label`.
2. O selo de status usa os tokens de status (`--status-good`, `--status-warning`,
   `--status-critical`), **não** as classes `bg-green-100 dark:bg-green-900/30` da aula — aquelas
   ignoram o nosso sistema e o `dark:` que evitamos. E o selo carrega **rótulo em texto**, não
   apenas cor: "Meta viável no prazo" / "Ajuste necessário" / "Meta inviável no prazo". É a mesma
   razão pela qual o `StatTile` codifica direção três vezes.
3. `status` desconhecido (a IA pode inventar um) cai em um fallback neutro sem selo, jamais em
   `undefined.className`.
4. No desktop o painel rola internamente (`lg:max-h-…` + `overflow-y-auto`), para os cards
   laterais continuarem visíveis.

**Aceite** — as seis seções renderizam a partir de um `InsightData` fixo; listas vazias não deixam
título órfão; status desconhecido não quebra.

**Testes** — renderize com um `InsightData` mock e confira as seções, o selo de cada um dos três
status e o fallback.

**Commit:** `feat(insights): exibe o diagnóstico financeiro gerado pela IA`

---

## E10 — Histórico (Desafio 1)

**Arquivos**

- `src/features/simulations/HistoryList.tsx` — novo
- `src/routes/HistoryPage.tsx` — novo
- ✏️ `src/App.tsx` — o `Sheet` passa a renderizar o `HistoryList`

**Passos**

1. `HistoryList` lista os registros do mais recente para o mais antigo: meta, custo, data e um
   indicador de se o diagnóstico já foi gerado.
2. "Ver detalhes" navega para `/resultado/:id`. Como o insight está salvo (E7), abre instantâneo e
   sem custo de API.
3. Excluir: confirmação antes (é irreversível e não há backup), `deleteSimulation`, lista
   atualizada. **Não use `window.confirm`** — use o `Sheet`/diálogo do design system.
4. O estado vazio já existe no `App.tsx`; ✏️ só o texto muda, porque agora os dados _são_ gravados
   no dispositivo. Diga isso, e diga que dá para apagar.
5. `HistoryPage` (`/historico`) é o mesmo componente em página cheia — o `Sheet` serve o acesso
   rápido, a rota serve link direto e mobile.

**Aceite** — três simulações aparecem na ordem certa; excluir remove só a escolhida e persiste
após recarregar; "ver detalhes" abre o resultado sem nova chamada à IA.

**Commit:** `feat(history): lista, abre e exclui simulações salvas`

---

## E11 — Conversar com o educador (Desafio 2)

**Arquivos**

- `src/features/insights/chat.ts` — novo (prompt de acompanhamento + chamada)
- `src/features/insights/InsightChat.tsx` — novo
- ✏️ `src/features/simulations/storage.ts` — `SimulationRecord` ganha `messages?: ChatMessage[]`
- ✏️ `src/features/insights/InsightPanel.tsx` — o chat entra abaixo do diagnóstico

**Passos**

1. `ChatMessage = { id: string; role: 'user' | 'assistant'; content: string; createdAt: string }`.
2. O prompt de acompanhamento carrega **os dados da simulação, o diagnóstico já gerado e o
   histórico da conversa**. Sem os três, a IA responde genérico e perde o fio.
3. Limite o histórico enviado (as últimas ~10 mensagens). Conversa longa cresce o prompt sem
   limite, e custo e latência crescem junto.
4. Cada resposta é gravada em `messages` no registro, para a conversa sobreviver ao reload.
5. Rolagem automática ao chegar resposta (`scrollIntoView` no fim da lista) — e respeite
   `prefers-reduced-motion` no `behavior`.
6. Estados de carregando e erro **por mensagem**, não do painel inteiro: a pergunta que falhou
   precisa poder ser reenviada sem apagar o resto da conversa.
7. Enviar com Enter, quebra de linha com Shift+Enter, botão desabilitado com campo vazio ou
   requisição em voo.

**Aceite** — perguntar devolve resposta contextualizada; o histórico sobrevive ao reload; falha em
uma pergunta não derruba a conversa; a lista rola sozinha.

**Commit:** `feat(chat): permite conversar com o educador financeiro sobre a simulação`

---

## 5. Checklist final

- [ ] `npm run validate` verde (typecheck + lint + format + testes)
- [ ] `npm run build` e `npm run preview` funcionando
- [ ] Fluxo completo: 7 perguntas → resultado com diagnóstico → histórico → reabrir → chat
- [ ] Sem chamada à API ao reabrir uma simulação já diagnosticada
- [ ] Uma requisição por simulação em dev, com StrictMode ligado
- [ ] Tudo checado nos dois temas, claro e escuro
- [ ] Mobile (375px) e desktop (1440px)
- [ ] `.env.local` fora do Git; `.env.example` dentro
- [ ] Sem chave de API em nenhum arquivo versionado
- [ ] Fluxo navegável por teclado; painel de insight anunciado por leitor de tela

## 6. Pontos de atenção

**A chave no cliente.** Repetindo, porque é o único risco desta lista que custa dinheiro: em
deploy público, a chave é lida por qualquer visitante. Proxy, ou restrição por referrer somada a
limite de cota.

**A IA não cumpre contrato.** Ela pode devolver texto fora do JSON, listas maiores que o pedido,
um `status` que não existe. Todo consumo da resposta valida antes de usar. `responseMimeType`
ajuda, não garante.

**Cota gratuita.** O tier gratuito do Gemini tem limite por minuto e por dia. O cache da E7 não é
otimização — é o que mantém o app usável durante o desenvolvimento.

**Divergência entre tela e prompt.** No dia em que a fórmula da sobra mensal mudar, ela precisa
mudar em um lugar só. Por isso `buildPlan` alimenta os dois. Se em algum momento o prompt começar
a recalcular por conta própria, a divergência é questão de tempo.
