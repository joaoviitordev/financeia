# Spec: Histórico de simulações

> feature: historico
> status: auditada

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

- **Dado** o histórico com uma simulação na lista
- **Quando** aciono "ver detalhes" nessa simulação
- **Então** chego ao endereço de resultado dela, com os números daquela simulação na tela

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

### US-012 — O histórico tem endereço próprio

Como pessoa no celular ou com um link salvo, quero uma página de histórico, para chegar à lista
direto e poder guardar o endereço.

#### AC-036 — `/historico` mostra a lista em página cheia

- **Dado** que tenho simulações guardadas
- **Quando** abro o endereço `/historico`
- **Então** vejo a lista das minhas simulações, dentro do cabeçalho e do rodapé da aplicação

#### AC-037 — Voltar do histórico devolve a pessoa à tela em que estava

- **Dado** que cheguei ao histórico a partir do resultado de uma simulação
- **Quando** aciono voltar
- **Então** estou de novo naquele resultado; e se eu tiver aberto `/historico` direto, sem tela
  anterior, voltar me leva à apresentação da simulação

## Fora de escopo

- Conversa com o educador financeiro (etapa E11 do roteiro).
- Renomear, duplicar, comparar ou exportar simulações.
- Busca, filtro, paginação ou ordenação escolhida pela pessoa — a lista é curta e a ordem é uma só.
- Sincronizar entre dispositivos, ou qualquer coisa que tire os dados desta máquina.
- Desfazer uma exclusão: a confirmação é a proteção, e não haverá lixeira.

## Suposições

| ID      | Suposição                                                                                     | Status     | Resolução                                                                                                  |
| ------- | --------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| ASM-013 | A rota `/historico` é a única casa da lista; a sheet do cabeçalho foi retirada                | confirmada | Decisão do dono do produto em 2026-08-23: duas portas para a mesma lista na mesma tela é redundância       |
| ASM-014 | A confirmação de exclusão usa a sheet do design system, nunca o `window.confirm`              | confirmada | Decisão técnica (roteiro E10): o diálogo do navegador ignora o tema, o foco e o idioma do produto          |
| ASM-015 | Não há teto de simulações guardadas                                                           | confirmada | Decisão do dono do produto em 2026-08-22: descartar trabalho sem a pessoa pedir é pior que o risco de cota |
| ASM-016 | Existe um "apagar tudo", com a mesma confirmação da exclusão única                            | confirmada | Decisão do dono do produto em 2026-08-22: é o que o estado vazio já promete                                |
| ASM-019 | Voltar do histórico sem tela anterior (link direto, favorito) leva à apresentação             | confirmada | Decisão técnica: é melhor que um botão morto ou um passo para fora do aplicativo                           |
| ASM-018 | A ordem da lista vem do campo `createdAt` de cada registro, e não da posição no armazenamento | confirmada | Decisão técnica: a posição é detalhe de gravação; a data é o que a pessoa entende por "mais recente"       |

## Perguntas em aberto

| ID    | Pergunta                                                                                                     | Status     | Resposta                                                                                                        |
| ----- | ------------------------------------------------------------------------------------------------------------ | ---------- | --------------------------------------------------------------------------------------------------------------- |
| Q-005 | Simulação abandonada no meio das perguntas deveria aparecer no histórico?                                    | respondida | Não: só existe registro depois de concluir. Rascunho no histórico seria promessa que o armazenamento não cumpre |
| Q-006 | O histórico expõe renda e dívidas de quem usa o dispositivo. Isso pede alguma proteção antes de listar tudo? | respondida | Não nesta etapa: os dados já estão no dispositivo e são de quem o usa. Se um dia houver conta, a conversa muda  |
