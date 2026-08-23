# Spec: Chat educador

> feature: chat-educador
> status: rascunho

<!--
  Como ler este arquivo (o formato é verificado por `onp-spec audit`):
  - US-xxx = história de usuário · AC-xxx = critério de aceite
    ASM-xxx = suposição · Q-xxx = pergunta em aberto
    São códigos de rastreio: ligam a especificação às tarefas e aos testes.
  - Toda história de usuário precisa de pelo menos um critério de aceite.
  - Todo critério de aceite precisa de Dado/Quando/Então completos.
  - Os códigos são únicos no projeto inteiro (nunca reutilize um número).
-->

## Contexto

O diagnóstico chega pronto e cala. Quem lê "corte gastos fixos" fica sem o passo seguinte — qual
gasto, quanto, e o que muda no prazo se cortar. Esta feature abre uma conversa sobre a própria
simulação, abaixo do diagnóstico, para que a dúvida que nasce da leitura seja respondida com os
números daquela pessoa em vez de conselho genérico. É a etapa E11 do roteiro (Desafio 2).

## Histórias

### US-013 — Perguntar sobre o meu plano

Como pessoa que acabou de ler o diagnóstico, quero perguntar sobre ele, para entender o que fazer
com os meus números em vez de reler um texto que não responde a minha dúvida.

#### AC-038 — A conversa só abre quando há diagnóstico

- **Dado** que estou na página de resultado e o diagnóstico ainda não está na tela (carregando,
  falhou, ou falta a chave da API)
- **Quando** olho a página
- **Então** não há conversa nenhuma ali; ela aparece assim que o diagnóstico aparece

#### AC-039 — Perguntar devolve uma resposta na conversa

- **Dado** a conversa aberta abaixo do diagnóstico
- **Quando** escrevo uma pergunta e envio
- **Então** minha pergunta entra na conversa e a resposta do educador entra abaixo dela

#### AC-040 — O pedido carrega a simulação, o diagnóstico e a conversa até aqui

- **Dado** uma conversa que já tem perguntas e respostas anteriores
- **Quando** envio mais uma pergunta
- **Então** o texto enviado ao serviço leva os números da simulação, o diagnóstico já gerado e as
  mensagens anteriores — sem os três, a resposta perde o fio

#### AC-041 — A conversa enviada tem teto

- **Dado** uma conversa com mais mensagens do que o teto de contexto
- **Quando** envio mais uma pergunta
- **Então** o pedido leva apenas as mensagens mais recentes, até o teto, e a pergunta nova está
  entre elas

### US-014 — Escrever sem atrito

Como pessoa digitando uma dúvida, quero enviar pelo teclado e ver que a resposta está vindo, para
não ficar em dúvida se a pergunta saiu.

#### AC-042 — Enter envia, Shift+Enter quebra linha

- **Dado** o campo da conversa com texto escrito
- **Quando** aperto Enter
- **Então** a pergunta é enviada; e com Shift+Enter, em vez de enviar, o texto ganha uma linha nova

#### AC-043 — Não dá para enviar vazio nem duas vezes

- **Dado** o campo vazio, ou uma pergunta ainda esperando resposta
- **Quando** tento enviar
- **Então** o envio está bloqueado, e volta a funcionar quando há texto e nenhuma pergunta em voo

#### AC-044 — A conversa rola até a mensagem nova

- **Dado** uma conversa mais alta que a área visível
- **Quando** uma mensagem nova entra
- **Então** a conversa rola até ela sozinha, e sem animação para quem pediu menos movimento no
  sistema

### US-015 — A conversa acompanha a simulação

Como pessoa que fecha o navegador e volta depois, quero encontrar a conversa como deixei, para não
recomeçar a explicar o que já expliquei.

#### AC-045 — A conversa sobrevive ao recarregar

- **Dado** uma conversa com perguntas e respostas numa simulação
- **Quando** recarrego a página de resultado dela
- **Então** as mesmas mensagens estão lá, na mesma ordem

#### AC-046 — Mudar uma resposta descarta a conversa junto com o diagnóstico

- **Dado** uma simulação com diagnóstico e conversa guardados
- **Quando** volto, altero uma resposta e concluo de novo
- **Então** a conversa antiga não está mais lá, pela mesma razão que o diagnóstico antigo também
  não: os dois falavam de números que deixaram de valer

### US-016 — Uma pergunta que falha não leva a conversa junto

Como pessoa numa conexão instável, quero reenviar a pergunta que falhou, para não perder a conversa
inteira por causa de uma resposta que não veio.

#### AC-047 — Enquanto a resposta não chega, a pergunta mostra que ela está vindo

- **Dado** que acabei de enviar uma pergunta
- **Quando** a resposta ainda não voltou
- **Então** aquela pergunta mostra que a resposta está a caminho, e o resto da conversa continua
  legível

#### AC-048 — A pergunta que falhou é dita pelo nome e pode ser reenviada

- **Dado** uma pergunta cuja resposta falhou
- **Quando** olho a conversa
- **Então** a falha aparece naquela pergunta, com o motivo e um caminho para tentar de novo, e as
  mensagens anteriores continuam todas ali

## Fora de escopo

- Conversar sem ter diagnóstico gerado (ASM-021).
- Apagar mensagens uma a uma, editar pergunta já enviada, ou copiar a conversa.
- Respostas em fluxo (streaming) — a resposta aparece inteira quando chega.
- Anexar arquivo, imagem ou áudio à pergunta.
- Levar a conversa para outro dispositivo: ela vive no mesmo armazenamento local da simulação.

## Suposições

| ID      | Suposição                                                                             | Status     | Resolução                                                                                                                             |
| ------- | ------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| ASM-020 | A conversa é um card próprio, abaixo do diagnóstico, e não uma seção dentro do painel | confirmada | Decisão do dono do produto em 2026-08-23: o painel já tem quatro estados exclusivos, e a conversa dobraria isso                       |
| ASM-021 | Sem diagnóstico na tela, a conversa não aparece                                       | confirmada | Decisão do dono do produto em 2026-08-23: o pedido precisa do diagnóstico, e sem ele a resposta sai genérica                          |
| ASM-022 | Alterar uma resposta descarta a conversa junto com o diagnóstico                      | confirmada | Decisão do dono do produto em 2026-08-23: manter seria deixar conselho sobre números que não valem mais                               |
| ASM-023 | O teto de contexto enviado é de 10 mensagens                                          | confirmada | Decisão técnica (roteiro E11): conversa longa cresce o pedido sem limite, e custo e demora crescem junto                              |
| ASM-024 | A resposta da conversa é texto livre, não JSON                                        | confirmada | Decisão técnica: `generateInsight` força `responseMimeType: application/json`, que serve ao diagnóstico e não a uma resposta em prosa |
| ASM-025 | As mensagens moram no próprio registro da simulação, num campo `messages`             | confirmada | Decisão técnica (roteiro E11): a conversa é da simulação, e separá-la criaria dois armazenamentos para manter em dia                  |
| ASM-026 | Conversa corrompida no armazenamento custa a conversa, nunca o registro               | confirmada | Decisão técnica: é a mesma regra que o diagnóstico já segue em `withValidInsight`                                                     |

## Perguntas em aberto

| ID    | Pergunta                                                                                                                                                   | Status | Resposta |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | -------- |
| Q-007 | Há teto de mensagens **guardadas** por simulação? O teto de ASM-023 é só do que se envia à IA; o armazenamento cresce sem limite e o localStorage tem cota | aberta | —        |
| Q-008 | Dá para apagar só a conversa, mantendo a simulação e o diagnóstico? Hoje a única saída seria apagar a simulação inteira                                    | aberta | —        |
