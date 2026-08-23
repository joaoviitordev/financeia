# Tasks: Histórico de simulações

> feature: historico

<!--
  Ordem do arquivo = ordem de dependência: cada tarefa só usa o que a anterior
  já entregou. Nenhuma das três roda em paralelo com as outras.
  Status: pendente | em-andamento | concluida
-->

## T-014 — Excluir e limpar no armazenamento [concluida]

- Refs: US-011, AC-033, AC-034
- Arquivos: src/features/simulations/storage.ts, src/features/simulations/storage.test.ts
- Modelo: claude-sonnet-5
- Esforço: medio
- Notas: `deleteSimulation(id): boolean` e `clearSimulations(): boolean`, no mesmo estilo hostil do resto do módulo — id inexistente devolve false, escrita recusada devolve false, nada lança. Excluir uma simulação não pode encostar nas outras, e o efeito precisa sobreviver a uma releitura do armazenamento (é o que o AC-033 chama de "não volta ao recarregar"). `clearSimulations` remove a chave inteira em vez de gravar um array vazio: menos lixo e a leitura já trata chave ausente. A ordenação NÃO entra aqui — `listSimulations` continua devolvendo o que está guardado, na ordem em que está.

## T-015 — A lista do histórico [concluida]

- Refs: US-009, AC-027, AC-028, AC-029, AC-032
- Arquivos: src/features/simulations/HistoryList.tsx, src/features/simulations/HistoryList.test.tsx
- Modelo: claude-sonnet-5
- Esforço: alto
- Notas: depende de T-014. Um componente só, servindo a rota `/historico` (ASM-013). Ordena por `createdAt`, do mais recente para o mais antigo (ASM-018), e mostra objetivo, custo da meta e data — o custo sai de `buildPlan`, como no resto do produto, nunca recalculado à mão. O indicador de diagnóstico carrega texto, não só cor (AC-028), pela mesma razão do `StatTile` e do selo de viabilidade. Excluir abre confirmação na `Sheet` do design system, com o `footer` dela para as ações; `window.confirm` é proibido (ASM-014). Cancelar mantém a simulação. Estado vazio com saída para começar uma simulação (AC-029). "Apagar tudo" fica discreto, no fim da lista, e passa pela mesma confirmação (ASM-016). O componente recebe por props o que fazer ao abrir uma simulação — quem conhece rotas é quem o usa, não ele.

## T-016 — O histórico no endereço próprio [concluida]

- Refs: US-010, US-012, AC-030, AC-031, AC-036, AC-037
- Arquivos: src/App.tsx, src/router.tsx, src/routes/HistoryPage.tsx, src/routes/HistoryPage.test.tsx, src/features/simulations/historico-navegacao.test.tsx
- Modelo: claude-sonnet-5
- Esforço: alto
- Notas: depende de T-015. O botão do cabeçalho navega para `/historico`, e a `HistoryPage` é a lista em página cheia, na rota que antes era placeholder (AC-036). Abrir uma simulação leva a `/resultado/<id>` (AC-030). A página cheia não devolve a pessoa ao lugar de onde veio só de fechar, como a sheet fazia — por isso o botão de voltar, com queda para `/` quando não há tela anterior (AC-037, ASM-019). O teste do AC-031 prova o que o cache comprou: abrir pelo histórico uma simulação com diagnóstico guardado não dispara nenhuma chamada (`fetch` dublado, contagem zero).
