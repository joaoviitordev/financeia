# Spec: Histórico de simulações

> feature: historico
> status: rascunho

## Contexto

As simulações já ficam guardadas no dispositivo e cada uma tem endereço próprio, mas não existe
lugar nenhum onde a pessoa veja o que guardou: o painel de histórico do cabeçalho abre num estado
vazio permanente, e `/historico` é um placeholder. Quem fechou a aba perdeu o endereço e perdeu a
simulação na prática. Esta feature dá lista, entrada e saída ao que já está gravado — inclusive o
direito de apagar. Corresponde à etapa E10 de `docs/roteiro-planejai.md`.

## Histórias

### US-009 — Ver o que já simulei

Como pessoa que simulou mais de uma vez, quero ver minhas simulações guardadas, para voltar a
qualquer uma sem precisar do endereço que anotei em lugar nenhum.

#### AC-027 — A lista mostra as simulações, da mais recente para a mais antiga

- **Dado** que guardei três simulações em momentos diferentes
- **Quando** abro o histórico
- **Então** vejo as três, começando pela mais recente, cada uma com o objetivo, o custo da meta e a
  data em que foi criada

#### AC-028 — A lista diz quais já têm diagnóstico

- **Dado** uma simulação com diagnóstico guardado e outra sem
- **Quando** abro o histórico
- **Então** distingo uma da outra por um indicador com texto, não apenas por cor

#### AC-029 — Sem nada guardado, o histórico explica o que vai aparecer ali

- **Dado** que nunca concluí uma simulação
- **Quando** abro o histórico
- **Então** vejo um aviso de que ainda não há simulações e um caminho para começar uma

### US-010 — Voltar a uma simulação guardada

Como pessoa que quer reler um diagnóstico, quero abrir uma simulação da lista, para rever os
números e o texto sem gerar tudo de novo.

#### AC-030 — Abrir uma simulação leva ao resultado dela

- **Dado** o histórico aberto com uma simulação na lista
- **Quando** aciono "ver detalhes" nessa simulação
- **Então** chego ao endereço de resultado dela, e o histórico se fecha

#### AC-031 — Reabrir pelo histórico não custa uma nova geração

- **Dado** uma simulação cujo diagnóstico já foi gerado
- **Quando** abro essa simulação pelo histórico
- **Então** o diagnóstico guardado aparece sem nenhuma chamada à IA

### US-011 — Apagar o que não quero mais

Como pessoa cujos dados financeiros estão guardados no dispositivo, quero apagar simulações,
para não deixar minha renda e minhas dívidas na máquina para sempre.

#### AC-032 — Excluir pede confirmação antes

- **Dado** que aciono excluir numa simulação da lista
- **Quando** a confirmação aparece
- **Então** ela avisa que a ação não tem volta, e desistir dela mantém a simulação guardada

#### AC-033 — Excluir remove só a simulação escolhida, para sempre

- **Dado** três simulações guardadas
- **Quando** confirmo a exclusão de uma delas
- **Então** as outras duas continuam na lista, e a excluída não volta ao recarregar a página

#### AC-034 — Apagar tudo limpa o histórico inteiro, com a mesma cerimônia

- **Dado** o histórico com simulações
- **Quando** aciono apagar tudo e confirmo
- **Então** nenhuma simulação continua guardada e a lista mostra o estado vazio

#### AC-035 — Apagar a simulação aberta devolve a pessoa ao início

- **Dado** que estou na página de resultado de uma simulação
- **Quando** apago justamente essa simulação pelo histórico
- **Então** vou para a apresentação da simulação, sem passar por tela de erro

### US-012 — O histórico tem endereço próprio

Como pessoa no celular ou com um link salvo, quero uma página de histórico, para chegar à lista
direto, sem depender do painel do cabeçalho.

#### AC-036 — `/historico` mostra a mesma lista em página cheia

- **Dado** que tenho simulações guardadas
- **Quando** abro o endereço `/historico`
- **Então** vejo a mesma lista da sheet do cabeçalho, dentro do cabeçalho e do rodapé da aplicação

## Fora de escopo

- Conversa com o educador financeiro (etapa E11 do roteiro).
- Renomear, duplicar, comparar ou exportar simulações.
- Busca, filtro, paginação ou ordenação escolhida pela pessoa — a lista é curta e a ordem é uma só.
- Sincronizar entre dispositivos, ou qualquer coisa que tire os dados desta máquina.
- Desfazer uma exclusão: a confirmação é a proteção, e não haverá lixeira.

## Suposições

| ID      | Suposição                                                                                     | Status     | Resolução                                                                                                  |
| ------- | --------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| ASM-013 | A mesma lista serve a sheet do cabeçalho e a rota `/historico` — um componente, dois lugares  | confirmada | Decisão técnica (roteiro E10): a sheet é acesso rápido, a rota é link direto e celular                     |
| ASM-014 | A confirmação de exclusão usa a sheet do design system, nunca o `window.confirm`              | confirmada | Decisão técnica (roteiro E10): o diálogo do navegador ignora o tema, o foco e o idioma do produto          |
| ASM-015 | Não há teto de simulações guardadas                                                           | confirmada | Decisão do dono do produto em 2026-08-22: descartar trabalho sem a pessoa pedir é pior que o risco de cota |
| ASM-016 | Existe um "apagar tudo", com a mesma confirmação da exclusão única                            | confirmada | Decisão do dono do produto em 2026-08-22: é o que o estado vazio já promete                                |
| ASM-017 | Apagar a simulação que está aberta leva para a raiz                                           | confirmada | Decisão do dono do produto em 2026-08-22: é consequência do que a pessoa fez, não erro                     |
| ASM-018 | A ordem da lista vem do campo `createdAt` de cada registro, e não da posição no armazenamento | confirmada | Decisão técnica: a posição é detalhe de gravação; a data é o que a pessoa entende por "mais recente"       |

## Perguntas em aberto

| ID    | Pergunta                                                                                                     | Status     | Resposta                                                                                                        |
| ----- | ------------------------------------------------------------------------------------------------------------ | ---------- | --------------------------------------------------------------------------------------------------------------- |
| Q-005 | Simulação abandonada no meio das perguntas deveria aparecer no histórico?                                    | respondida | Não: só existe registro depois de concluir. Rascunho no histórico seria promessa que o armazenamento não cumpre |
| Q-006 | O histórico expõe renda e dívidas de quem usa o dispositivo. Isso pede alguma proteção antes de listar tudo? | respondida | Não nesta etapa: os dados já estão no dispositivo e são de quem o usa. Se um dia houver conta, a conversa muda  |
