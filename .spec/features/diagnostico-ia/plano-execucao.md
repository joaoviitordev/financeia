# Plano de execução — diagnostico-ia

> gerado por `onp-spec plano` em 2026-08-22 21:55 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano diagnostico-ia --paralelizar T-006,T-007`

## Resumo — o que vai acontecer

- **8 tarefa(s) pendente(s)**: 2 em 2 faixa(s) paralela(s) + 6 sequencial(is)
- **seleção do usuário**: paralelizar só T-006, T-007 — as demais rodam uma após a outra, ao final
- **1 faixa = 1 worktree + 1 branch + 1 janela de contexto limpa** — faixas não compartilham nenhum arquivo entre si
- prefere outra seleção ou uma após a outra? Regenere com `onp-spec plano diagnostico-ia --paralelizar T-xxx,T-yyy` ou `--sequencial`
- tudo acontece na branch de trabalho `spec/diagnostico-ia`; levar para a main é decisão sua

## Faixas e ondas

### Onda 1 — faixa-1 ∥ faixa-2

#### faixa-1 — branch `spec/diagnostico-ia-faixa-1` — worktree `../onp-worktrees/financeia-diagnostico-ia-faixa-1`

| tarefa | título                                        | modelo            | esforço | arquivos                                                                                                                                                                                         |
| ------ | --------------------------------------------- | ----------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| T-006  | Contrato do diagnóstico, viabilidade e prompt | `claude-sonnet-5` | high    | `src/features/insights/types.ts`, `src/features/insights/feasibility.ts`, `src/features/insights/feasibility.test.ts`, `src/features/insights/prompt.ts`, `src/features/insights/prompt.test.ts` |

#### faixa-2 — branch `spec/diagnostico-ia-faixa-2` — worktree `../onp-worktrees/financeia-diagnostico-ia-faixa-2`

| tarefa | título                  | modelo            | esforço | arquivos                                                                                                               |
| ------ | ----------------------- | ----------------- | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| T-007  | Chave da API e ambiente | `claude-sonnet-5` | low     | `.env.example`, `src/env.d.ts`, `src/features/insights/config.ts`, `src/features/insights/config.test.ts`, `README.md` |

## Tarefas sequenciais (após as ondas, na árvore principal)

| tarefa | título                                           | modelo            | esforço | por que sequencial         |
| ------ | ------------------------------------------------ | ----------------- | ------- | -------------------------- |
| T-008  | Serviço do Gemini e leitura da resposta          | `claude-sonnet-5` | high    | fora da seleção do usuário |
| T-009  | O diagnóstico guardado junto da simulação        | `claude-sonnet-5` | medium  | fora da seleção do usuário |
| T-010  | Hook do diagnóstico, com cache e trava           | `claude-sonnet-5` | high    | fora da seleção do usuário |
| T-011  | Concluir de novo descarta o diagnóstico velho    | `claude-sonnet-5` | low     | fora da seleção do usuário |
| T-012  | O diagnóstico na tela                            | `claude-sonnet-5` | high    | fora da seleção do usuário |
| T-013  | Esqueleto, carregando, erro e o painel na página | `claude-sonnet-5` | high    | fora da seleção do usuário |

## Gestão de branches e commits

1. branch de trabalho `spec/diagnostico-ia` criada do ponto atual (se ainda não existir)
2. cada faixa nasce dela como branch própria e roda no seu worktree — **1 tarefa = 1 commit** (`T-xxx feature: título`)
3. terminou a onda → merge `--no-ff` de cada faixa de volta, na ordem; conflito interrompe a faixa e pede resolução humana
4. faixa mesclada → worktree removido, branch apagada, tarefa marcada `[concluida]` no tasks.md
5. gate final na branch de trabalho: `onp-spec verify diagnostico-ia` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Execução — Claude Code headless

```bash
bash .spec/features/diagnostico-ia/executar-tarefas.sh
```

Cada faixa roda `claude -p` com **janela de contexto limpa**, no seu worktree, com
`--model` e `--effort` já definidos por tarefa e permissões `acceptEdits`. Os prompts exatos estão
embutidos no script — quer rodar uma faixa na mão, é só copiá-los de lá.
Logs: `../onp-worktrees/financeia-diagnostico-ia-logs/`.

### 📣 Acompanhamento — tabela + resumo no chat (a cada 1 min)

O script roda em **background**: o agente AVISA o usuário antes de iniciar e,
enquanto roda, posta no chat a cada ~1 minuto a **tabela de andamento** (qual
tarefa está rodando, qual não está, o que concluiu/falhou) junto com o
**resumo geral de andamento** (escrito por IA; sem IA, o motor resume). Ao
final, o usuário recebe o resumo completo da execução. A qualquer momento:

```bash
onp-spec resumo diagnostico-ia --tabela   # a tabela de andamento
onp-spec resumo diagnostico-ia            # o resumo em texto
```
