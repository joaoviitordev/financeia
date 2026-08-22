# Tasks: Resultado persistido

> feature: resultado-persistido

## T-001 — Rotas e layout raiz [pendente]

- Refs: US-001, AC-001, AC-002
- Arquivos: src/router.tsx, src/routes/SimulationPage.tsx, src/App.tsx, src/main.tsx, src/App.test.tsx, src/routes/SimulationPage.test.tsx
- Modelo: claude-sonnet-5
- Esforço: medio
- Notas: `react-router-dom` já está instalado. No App.tsx a única mudança é trocar `<Onboarding />` por `<Outlet />` dentro do `<main>`; Header, Footer e o Sheet de histórico ficam onde estão. O botão "nova simulação" passa a navegar para `/`, e a SimulationPage remonta o fluxo com `key={location.key}`. Rotas: `/`, `/resultado/:id` e `/historico` (as duas últimas com placeholder por enquanto).

## T-002 — Perguntas de dívidas e prazo, com o cálculo [pendente]

- Refs: US-002, AC-003, AC-004, AC-005, AC-006
- Arquivos: src/features/onboarding/questions.ts, src/features/onboarding/fields/types.ts, src/features/onboarding/fields/registry.ts, src/features/onboarding/answers-to-plan.ts, src/features/onboarding/goals.ts, src/components/ui/Field.tsx, src/features/onboarding/goals.test.ts, src/features/onboarding/Onboarding.test.tsx, src/features/onboarding/dividas-e-prazo.test.tsx
- Modelo: claude-sonnet-5
- Esforço: alto
- Notas: dois tipos de campo novos no registry — `currencyOptional` (aceita zero e vazio, para dívidas) e `months` (inteiro de 1 a 120). Nenhum componente de tela decide por tipo: tudo passa pelo registry. Em goals.ts a sobra mensal vira renda − gastos fixos − dívidas, e o plano guarda o prazo desejado. Os testes existentes de goals e do Onboarding contam passos e conferem contas: atualize os números, não afrouxe as asserções.

## T-003 — Armazenamento das simulações [pendente]

- Refs: US-003, AC-007, AC-008, AC-009
- Arquivos: src/features/simulations/storage.ts, src/features/simulations/storage.test.ts
- Modelo: claude-sonnet-5
- Esforço: alto
- Notas: `listSimulations`, `getSimulation(id)`, `saveSimulation(answers): string` (id por `crypto.randomUUID()`) e `updateSimulation(id, patch)`. Chave `financeia:simulations:v1`, registro `{ id, createdAt, answers }`. Trate o armazenamento como hostil: JSON corrompido, quota estourada e escrita que lança não podem derrubar a tela — leitura devolve lista vazia, escrita devolve false. Nada de cast cru sobre o `JSON.parse`: valide array e `id` string (`any` e `!` são erro de lint aqui).

## T-004 — Página de resultado [concluida]

- Refs: US-004, AC-011, AC-012
- Arquivos: src/routes/ResultPage.tsx, src/features/simulations/SimulationCards.tsx, src/routes/ResultPage.test.tsx
- Modelo: claude-sonnet-5
- Esforço: alto
- Notas: depende de T-001 (rotas) e T-003 (armazenamento) — roda depois das duas. Lê o id com `useParams`, busca a simulação e monta os cards com `StatTile` e `Card` que já existem, sem criar componente de card novo. Os números derivados saem de `buildPlan`, nunca recalculados à mão. Id inexistente mostra estado vazio com saída para `/`. Reserve o espaço do painel de insights com um placeholder — ele é preenchido na feature seguinte.

## T-005 — Conclusão guarda a simulação e navega [pendente]

- Refs: US-004, AC-010
- Arquivos: src/features/onboarding/useOnboarding.ts, src/routes/SimulationPage.tsx, src/App.tsx, src/features/simulations/conclusao.test.tsx
- Modelo: claude-sonnet-5
- Esforço: medio
- Notas: depende de T-001, T-002 e T-003. O hook não conhece rotas: ele guarda ao concluir e devolve o id; quem navega para `/resultado/<id>` é a SimulationPage. Atualize também o texto do estado vazio do histórico no App.tsx, que hoje afirma que nada é gravado (Q-001).
