# Plano de execução — historico

> gerado por `onp-spec plano` em 2026-08-22 23:11 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano historico --sequencial`

## Resumo — o que vai acontecer

- **modo SEQUENCIAL (escolha do usuário)**: 3 tarefa(s) pendente(s), UMA APÓS A OUTRA, na árvore principal
- sem worktrees e sem paralelismo — cada tarefa roda numa janela de contexto limpa, na ordem do tasks.md
- tudo acontece na branch de trabalho `spec/historico`; levar para a main é decisão sua

## Ordem de execução (uma tarefa após a outra)

| tarefa | título                                     | modelo            | esforço |
| ------ | ------------------------------------------ | ----------------- | ------- |
| T-014  | Excluir e limpar no armazenamento          | `claude-sonnet-5` | medium  |
| T-015  | A lista do histórico                       | `claude-sonnet-5` | high    |
| T-016  | O histórico na sheet e no endereço próprio | `claude-sonnet-5` | high    |

## Gestão de branches e commits

1. branch de trabalho `spec/historico` criada do ponto atual (se ainda não existir)
2. as tarefas rodam nela mesma, na ordem — **1 tarefa = 1 commit** (`T-xxx feature: título`), marcada `[concluida]` só com trabalho feito
3. gate final na branch de trabalho: `onp-spec verify historico` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Execução — Claude Code headless

```bash
bash .spec/features/historico/executar-tarefas.sh
```

Cada tarefa roda `claude -p` com **janela de contexto limpa**, na árvore principal,
uma após a outra, com `--model` e `--effort` já definidos por tarefa e permissões `acceptEdits`.
Os prompts exatos estão embutidos no script.
Logs: `../onp-worktrees/financeia-historico-logs/`.

### 📣 Acompanhamento — tabela + resumo no chat (a cada 1 min)

O script roda em **background**: o agente AVISA o usuário antes de iniciar e,
enquanto roda, posta no chat a cada ~1 minuto a **tabela de andamento** (qual
tarefa está rodando, qual não está, o que concluiu/falhou) junto com o
**resumo geral de andamento** (escrito por IA; sem IA, o motor resume). Ao
final, o usuário recebe o resumo completo da execução. A qualquer momento:

```bash
onp-spec resumo historico --tabela   # a tabela de andamento
onp-spec resumo historico            # o resumo em texto
```
