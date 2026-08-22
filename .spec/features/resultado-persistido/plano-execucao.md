# Plano de execução — resultado-persistido

> gerado por `onp-spec plano` em 2026-08-22 16:19 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano resultado-persistido --paralelizar T-001,T-002,T-003`

## Resumo — o que vai acontecer

- **5 tarefa(s) pendente(s)**: 3 em 3 faixa(s) paralela(s) + 2 sequencial(is)
- **seleção do usuário**: paralelizar só T-001, T-002, T-003 — as demais rodam uma após a outra, ao final
- **1 faixa = 1 worktree + 1 branch + 1 janela de contexto limpa** — faixas não compartilham nenhum arquivo entre si
- prefere outra seleção ou uma após a outra? Regenere com `onp-spec plano resultado-persistido --paralelizar T-xxx,T-yyy` ou `--sequencial`
- tudo acontece na branch de trabalho `spec/resultado-persistido`; levar para a main é decisão sua

## Faixas e ondas

### Onda 1 — faixa-1 ∥ faixa-2 ∥ faixa-3

#### faixa-1 — branch `spec/resultado-persistido-faixa-1` — worktree `../onp-worktrees/financeia-resultado-persistido-faixa-1`

| tarefa | título              | modelo            | esforço | arquivos                                                                                                                                   |
| ------ | ------------------- | ----------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| T-001  | Rotas e layout raiz | `claude-sonnet-5` | medium  | `src/router.tsx`, `src/routes/SimulationPage.tsx`, `src/App.tsx`, `src/main.tsx`, `src/App.test.tsx`, `src/routes/SimulationPage.test.tsx` |

#### faixa-2 — branch `spec/resultado-persistido-faixa-2` — worktree `../onp-worktrees/financeia-resultado-persistido-faixa-2`

| tarefa | título                                      | modelo            | esforço | arquivos                                                                                                                                                                                                                                                                                                                                                                                     |
| ------ | ------------------------------------------- | ----------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-002  | Perguntas de dívidas e prazo, com o cálculo | `claude-sonnet-5` | high    | `src/features/onboarding/questions.ts`, `src/features/onboarding/fields/types.ts`, `src/features/onboarding/fields/registry.ts`, `src/features/onboarding/answers-to-plan.ts`, `src/features/onboarding/goals.ts`, `src/components/ui/Field.tsx`, `src/features/onboarding/goals.test.ts`, `src/features/onboarding/Onboarding.test.tsx`, `src/features/onboarding/dividas-e-prazo.test.tsx` |

#### faixa-3 — branch `spec/resultado-persistido-faixa-3` — worktree `../onp-worktrees/financeia-resultado-persistido-faixa-3`

| tarefa | título                       | modelo            | esforço | arquivos                                                                          |
| ------ | ---------------------------- | ----------------- | ------- | --------------------------------------------------------------------------------- |
| T-003  | Armazenamento das simulações | `claude-sonnet-5` | high    | `src/features/simulations/storage.ts`, `src/features/simulations/storage.test.ts` |

## Tarefas sequenciais (após as ondas, na árvore principal)

| tarefa | título                                | modelo            | esforço | por que sequencial         |
| ------ | ------------------------------------- | ----------------- | ------- | -------------------------- |
| T-004  | Página de resultado                   | `claude-sonnet-5` | high    | fora da seleção do usuário |
| T-005  | Conclusão guarda a simulação e navega | `claude-sonnet-5` | medium  | fora da seleção do usuário |

## Gestão de branches e commits

1. branch de trabalho `spec/resultado-persistido` criada do ponto atual (se ainda não existir)
2. cada faixa nasce dela como branch própria e roda no seu worktree — **1 tarefa = 1 commit** (`T-xxx feature: título`)
3. terminou a onda → merge `--no-ff` de cada faixa de volta, na ordem; conflito interrompe a faixa e pede resolução humana
4. faixa mesclada → worktree removido, branch apagada, tarefa marcada `[concluida]` no tasks.md
5. gate final na branch de trabalho: `onp-spec verify resultado-persistido` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Execução — Claude Code headless

```bash
bash .spec/features/resultado-persistido/executar-tarefas.sh
```

Cada faixa roda `claude -p` com **janela de contexto limpa**, no seu worktree, com
`--model` e `--effort` já definidos por tarefa e permissões `acceptEdits`. Os prompts exatos estão
embutidos no script — quer rodar uma faixa na mão, é só copiá-los de lá.
Logs: `../onp-worktrees/financeia-resultado-persistido-logs/`.

### 📣 Acompanhamento — tabela + resumo no chat (a cada 1 min)

O script roda em **background**: o agente AVISA o usuário antes de iniciar e,
enquanto roda, posta no chat a cada ~1 minuto a **tabela de andamento** (qual
tarefa está rodando, qual não está, o que concluiu/falhou) junto com o
**resumo geral de andamento** (escrito por IA; sem IA, o motor resume). Ao
final, o usuário recebe o resumo completo da execução. A qualquer momento:

```bash
onp-spec resumo resultado-persistido --tabela   # a tabela de andamento
onp-spec resumo resultado-persistido            # o resumo em texto
```
