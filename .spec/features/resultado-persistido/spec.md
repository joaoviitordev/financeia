# Spec: Resultado persistido

> feature: resultado-persistido
> status: auditada

## Contexto

Hoje o fluxo de simulação vive inteiro na memória da aba: quem recarrega a página perde tudo, e
não existe endereço para voltar a uma simulação. Esta feature dá endereço, memória e uma página
de resultado à simulação — é a base sobre a qual o diagnóstico com IA (feature seguinte) vai
rodar. Corresponde às etapas E1 a E4 de `docs/roteiro-planejai.md`.

## Histórias

### US-001 — Cada etapa tem endereço próprio

Como pessoa usando o app, quero que cada etapa tenha um endereço, para que eu possa voltar,
compartilhar e recarregar sem perder o lugar.

#### AC-001 — O formulário abre na raiz

- **Dado** que abro o aplicativo em `/`
- **Quando** a página carrega
- **Então** vejo a apresentação da simulação dentro do cabeçalho e do rodapé da aplicação

#### AC-002 — Recomeçar pelo cabeçalho limpa as respostas

- **Dado** que estou no meio das perguntas, com respostas já preenchidas
- **Quando** aciono "nova simulação" no cabeçalho
- **Então** volto para a apresentação e nenhuma resposta anterior permanece

### US-002 — Dívidas e prazo entram na conversa

Como pessoa endividada ou com prazo definido, quero informar minhas parcelas mensais e em quantos
meses quero chegar lá, para que o plano reflita a minha realidade e não só a renda menos as contas.

#### AC-003 — O fluxo passa a ter sete perguntas

- **Dado** que inicio a simulação
- **Quando** a primeira pergunta aparece
- **Então** o indicador de progresso mostra que é o passo 1 de 7

#### AC-004 — Não ter dívida é uma resposta válida

- **Dado** que estou na pergunta sobre parcelas e empréstimos
- **Quando** informo zero
- **Então** consigo avançar para a pergunta seguinte

#### AC-005 — O prazo aceita de 1 a 120 meses

- **Dado** que estou na pergunta sobre o prazo da meta
- **Quando** informo 0 ou 121
- **Então** não consigo avançar; com 12, avanço normalmente

#### AC-006 — As dívidas reduzem a sobra mensal

- **Dado** renda de R$ 5.000, gastos fixos de R$ 2.000 e dívidas de R$ 500
- **Quando** o plano é montado
- **Então** a sobra mensal apresentada é de R$ 2.500

### US-003 — A simulação sobrevive ao recarregar

Como pessoa que fecha o navegador no meio do dia, quero que a simulação fique guardada no meu
dispositivo, para que eu possa voltar a ela depois sem responder tudo de novo.

#### AC-007 — Guardar e reler devolve as mesmas respostas

- **Dado** um conjunto de respostas concluído
- **Quando** guardo a simulação e busco pelo identificador devolvido
- **Então** recupero exatamente as mesmas respostas

#### AC-008 — Cada simulação tem identificador próprio

- **Dado** que guardo duas simulações diferentes
- **Quando** listo o que está guardado
- **Então** as duas aparecem, com identificadores distintos

#### AC-009 — Armazenamento corrompido não derruba o app

- **Dado** que o armazenamento do navegador contém conteúdo inválido na chave da aplicação
- **Quando** listo as simulações guardadas
- **Então** recebo uma lista vazia, sem erro na tela

### US-004 — Página de resultado com link permanente

Como pessoa que terminou de responder, quero cair numa página de resultado com endereço próprio,
para que eu possa revê-la depois e entender meus números de relance.

#### AC-010 — Concluir leva ao resultado da simulação criada

- **Dado** que respondi todas as perguntas
- **Quando** confirmo a última
- **Então** sou levada ao endereço de resultado da simulação recém-guardada

#### AC-011 — O resultado mostra os números da simulação

- **Dado** uma simulação guardada
- **Quando** abro o endereço de resultado dela
- **Então** vejo custo da meta, prazo desejado, sobra mensal, renda, gastos fixos e dívidas, em reais

#### AC-012 — Endereço de simulação inexistente é explicado

- **Dado** um endereço de resultado cujo identificador não existe
- **Quando** abro esse endereço
- **Então** vejo um aviso de que a simulação não foi encontrada e um caminho para começar outra

## Fora de escopo

- Diagnóstico gerado por IA (feature seguinte — etapas E5 a E9 do roteiro).
- Tela de histórico com listagem e exclusão (etapa E10).
- Conversa com o educador financeiro (etapa E11).
- Qualquer alteração no design system, no sistema de temas ou no cálculo da reserva de emergência
  além da entrada das dívidas.

## Suposições

| ID      | Suposição                                                                                                                             | Status     | Resolução                                                                                             |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| ASM-001 | Zero é resposta legítima para dívidas, via um tipo de campo "valor opcional" — o tipo "moeda" continua exigindo valor maior que zero  | confirmada | Decisão do dono do produto em 2026-08-22: aceitar 0 digitado                                          |
| ASM-002 | As simulações ficam na chave `financeia:simulations:v1` do armazenamento local, com as respostas aninhadas em `answers`               | confirmada | Decisão técnica (roteiro E3): o sufixo de versão evita adivinhar formato antigo quando o schema mudar |
| ASM-003 | A pergunta "quanto você já tem guardado" continua no fluxo, embora não exista no projeto de referência                                | confirmada | Ela alimenta o cálculo da reserva de emergência, que é um diferencial nosso                           |
| ASM-004 | A faixa de prazo é de 1 a 120 meses                                                                                                   | confirmada | Mesma faixa do projeto de referência                                                                  |
| ASM-005 | O audit cobre apenas o código novo desta trilha (`src/routes`, `src/features/simulations`, `src/features/insights`, `src/router.tsx`) | confirmada | Decisão do dono do produto em 2026-08-22: o que já estava pronto fica fora do gate                    |

## Perguntas em aberto

| ID    | Pergunta                                                                                             | Status     | Resposta                                                                                              |
| ----- | ---------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| Q-001 | Guardar dados no dispositivo contradiz o texto atual do histórico, que diz que nada é gravado. Muda? | respondida | Sim: o estado vazio do histórico passa a dizer que os dados ficam no dispositivo e podem ser apagados |
| Q-002 | Onde entram as duas perguntas novas na ordem do fluxo?                                               | respondida | Dívidas logo após gastos fixos; prazo como última pergunta, espelhando o projeto de referência        |
