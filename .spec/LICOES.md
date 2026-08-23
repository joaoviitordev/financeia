# LIÇÕES — mantido pelo motor (`onp-spec licoes`)

> Não edite à mão: qualquer escrita do motor sobrescreve este arquivo.
> Estado canônico em `.spec/licoes.json`; mutação só via `onp-spec licoes`.

## Confirmadas — carregue no Especificar/Projetar

Corroboradas em múltiplas features. Aplique como guia.

_nenhuma_

## Candidatas — em observação, NÃO aplicar ainda

Vistas em uma feature só. Registradas, não confiadas.

### L-001 — Sair com código 0 não é prova: o agente headless também sai 0 quando desiste e pede ajuda. Só marque a tarefa concluída depois do verify apontar PASS no critério dela.

- sinal: `TASK_CONCLUIDA_SEM_PROVA` · recorrência: 1 feature(s) · penalidades: 0
- features: diagnostico-ia
- última evidência: T-006 (diagnostico-ia, 2026-08-22T23:19:59.393Z)

### L-002 — Commit que toca src depois do verify deixa a prova obsoleta: rode verify de novo e regrave antes de dar a feature por fechada.

- sinal: `VERIFY_OBSOLETO` · recorrência: 1 feature(s) · penalidades: 0
- features: resultado-persistido
- última evidência: — (resultado-persistido, 2026-08-23T11:40:27.755Z)

### L-003 — Antes de rodar o executor headless, confira se o formato de commit do plano passa no commit-msg do projeto: hook que recusa o commit faz a faixa perder o trabalho no worktree e ainda marcar a tarefa como concluida.

- sinal: `TASK_CONCLUIDA_SEM_PROVA` · recorrência: 1 feature(s) · penalidades: 0
- features: chat-educador
- última evidência: T-017 (chat-educador, 2026-08-23T12:19:59.203Z)

## Quarentena — aplicadas e falharam, ignorar

A falha recorreu mesmo com a lição aplicada. Revisão é do usuário.

_nenhuma_
