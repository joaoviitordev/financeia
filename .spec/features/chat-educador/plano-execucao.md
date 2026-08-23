# Plano de execução — chat-educador

> gerado por `onp-spec plano` em 2026-08-23 12:08 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano chat-educador --paralelizar T-017,T-018`

## Resumo — o que vai acontecer

- **4 tarefa(s) pendente(s)**: 2 em 2 faixa(s) paralela(s) + 2 sequencial(is)
- **seleção do usuário**: paralelizar só T-017, T-018 — as demais rodam uma após a outra, ao final
- **1 faixa = 1 worktree + 1 branch + 1 janela de contexto limpa** — faixas não compartilham nenhum arquivo entre si
- prefere outra seleção ou uma após a outra? Regenere com `onp-spec plano chat-educador --paralelizar T-xxx,T-yyy` ou `--sequencial`
- tudo acontece na branch de trabalho `spec/chat-educador`; levar para a main é decisão sua

## Faixas e ondas

### Onda 1 — faixa-1 ∥ faixa-2

#### faixa-1 — branch `spec/chat-educador-faixa-1` — worktree `../onp-worktrees/financeia-chat-educador-faixa-1`

| tarefa | título                      | modelo            | esforço | arquivos                                                                                                                                                             |
| ------ | --------------------------- | ----------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-017  | A conversa no armazenamento | `claude-sonnet-5` | medium  | `src/features/insights/chat-types.ts`, `src/features/insights/chat-types.test.ts`, `src/features/simulations/storage.ts`, `src/features/simulations/storage.test.ts` |

#### faixa-2 — branch `spec/chat-educador-faixa-2` — worktree `../onp-worktrees/financeia-chat-educador-faixa-2`

| tarefa | título                     | modelo            | esforço | arquivos                                                              |
| ------ | -------------------------- | ----------------- | ------- | --------------------------------------------------------------------- |
| T-018  | O pedido de acompanhamento | `claude-sonnet-5` | high    | `src/features/insights/chat.ts`, `src/features/insights/chat.test.ts` |

## Tarefas sequenciais (após as ondas, na árvore principal)

| tarefa | título                            | modelo            | esforço | por que sequencial         |
| ------ | --------------------------------- | ----------------- | ------- | -------------------------- |
| T-019  | O painel da conversa              | `claude-sonnet-5` | high    | fora da seleção do usuário |
| T-020  | A conversa na página de resultado | `claude-sonnet-5` | high    | fora da seleção do usuário |

## Gestão de branches e commits

1. branch de trabalho `spec/chat-educador` criada do ponto atual (se ainda não existir)
2. cada faixa nasce dela como branch própria e roda no seu worktree — **1 tarefa = 1 commit** (`T-xxx feature: título`)
3. terminou a onda → merge `--no-ff` de cada faixa de volta, na ordem; conflito interrompe a faixa e pede resolução humana
4. faixa mesclada → worktree removido, branch apagada, tarefa marcada `[concluida]` no tasks.md
5. gate final na branch de trabalho: `onp-spec verify chat-educador` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Execução — Claude Code headless

```bash
bash .spec/features/chat-educador/executar-tarefas.sh
```

Cada faixa roda `claude -p` com **janela de contexto limpa**, no seu worktree, com
`--model` e `--effort` já definidos por tarefa e permissões `acceptEdits`. Os prompts exatos estão
embutidos no script — quer rodar uma faixa na mão, é só copiá-los de lá.
Logs: `../onp-worktrees/financeia-chat-educador-logs/`.

### 📣 Acompanhamento — tabela + resumo no chat (a cada 1 min)

O script roda em **background**: o agente AVISA o usuário antes de iniciar e,
enquanto roda, posta no chat a cada ~1 minuto a **tabela de andamento** (qual
tarefa está rodando, qual não está, o que concluiu/falhou) junto com o
**resumo geral de andamento** (escrito por IA; sem IA, o motor resume). Ao
final, o usuário recebe o resumo completo da execução. A qualquer momento:

```bash
onp-spec resumo chat-educador --tabela   # a tabela de andamento
onp-spec resumo chat-educador            # o resumo em texto
```
