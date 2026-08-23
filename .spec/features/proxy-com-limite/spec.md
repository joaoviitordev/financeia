# Spec: Proxy com limite

> feature: proxy-com-limite
> status: auditada

<!--
  Como ler este arquivo (o formato é verificado por `onp-spec audit`):
  - US-xxx = história de usuário · AC-xxx = critério de aceite
    ASM-xxx = suposição · Q-xxx = pergunta em aberto
    São códigos de rastreio: ligam a especificação às tarefas e aos testes.
-->

## Contexto

A feature `chave-no-servidor` tirou a chave do navegador, e com isso resolveu o risco maior: ninguém
mais lê a chave. Sobrou o risco menor e ainda real, que aquela spec registrou por escrito no fora de
escopo: o endereço `/api/gemini` ficou aberto a quem souber dele, e a cota continua sendo a de quem
publicou. Um script que descubra o endereço gasta o limite sem nunca ver a chave.

Esta feature põe três barreiras no caminho. Elas são desiguais de propósito, e vale dizer qual é qual
antes de alguém confiar demais nelas:

- **origem**: recusa quem não vem do próprio site. Barra `curl`, script solto e rastejação de bot.
  Quem forjar o cabeçalho passa, e isso é fácil de fazer.
- **tamanho**: nenhuma chamada pode custar mais que um teto. Esta é a única das três que vale contra
  um atacante decidido, porque limita o dano por chamada em vez de tentar contar chamadas.
- **rajada**: segura repetição rápida do mesmo endereço de rede. Sem armazenamento durável, cada
  instância da função conta só o que ela mesma viu, e instâncias nascem e morrem sozinhas (ASM-036).
  É amortecedor, não tranca.

Somadas, transformam "qualquer um gasta minha cota à vontade" em "gastar minha cota dá trabalho e
rende pouco". Isso é o que esta etapa entrega, e não mais que isso.

## Histórias

### US-020 — O proxy atende só o meu site

Como dono da chave, quero que o proxy recuse pedidos que não vêm do meu site, para que descobrir o
endereço não baste para usá-lo.

#### AC-056 — Pedido de fora do site é recusado sem tocar no Gemini

- **Dado** um pedido cuja origem é outro site, ou que não declara origem nenhuma
- **Quando** ele chega ao proxy
- **Então** é recusado, e o Gemini não é chamado nenhuma vez

#### AC-057 — O site continua funcionando sem cadastrar domínio

- **Dado** o site aberto no próprio endereço, seja em desenvolvimento ou no domínio publicado
- **Quando** a página pede o diagnóstico ou manda uma pergunta
- **Então** o pedido passa, sem que nenhum domínio precise ser cadastrado em lugar nenhum

### US-021 — Nenhuma chamada custa mais que o teto

Como dono da chave, quero um teto no tamanho do que é enviado, para que uma única chamada não possa
consumir um pedaço grande da cota.

#### AC-058 — Prompt acima do teto é recusado antes do Gemini

- **Dado** um pedido cujo texto passa do teto de tamanho
- **Quando** ele chega ao proxy
- **Então** é recusado sem chamar o Gemini, e o texto do produto continua bem abaixo do teto

### US-022 — Rajada é contida e explicada

Como pessoa usando o aplicativo, quero saber quando esbarrei num limite e o que fazer, para não achar
que o aplicativo quebrou.

#### AC-059 — Passado o teto de chamadas na janela, o proxy recusa

- **Dado** um mesmo endereço de rede que já fez o número máximo de chamadas na janela
- **Quando** ele faz mais uma
- **Então** é recusado sem chamar o Gemini, e volta a ser atendido quando a janela passa

#### AC-060 — O limite é de quem estourou, não de todo mundo

- **Dado** um endereço de rede que estourou o limite
- **Quando** outro endereço faz um pedido
- **Então** o outro é atendido normalmente

#### AC-061 — A tela diz que foi limite de uso, e não erro

- **Dado** o proxy recusando por rajada
- **Quando** a resposta chega ao navegador
- **Então** a tela explica que foram muitos pedidos em pouco tempo e que é para tentar de novo em
  seguida, com texto diferente do que ela usa para cota da API esgotada

## Fora de escopo

- **Contagem durável entre instâncias** (Q-010). Sem ela, o limite de rajada é melhor esforço, e a
  spec diz isso em vez de prometer o que não entrega.
- Autenticar quem usa: o aplicativo não tem contas, e criar uma só para o proxy seria trocar um
  problema por outro maior.
- Bloquear endereço de rede de forma permanente, ou manter lista de banidos.
- Registrar quem chamou, quanto e quando: seria dado novo guardado sobre pessoas, e esta etapa não
  precisa dele.
- Limite por custo real de token: o teto é de caracteres, que é o que dá para medir sem chamar a IA.

## Suposições

| ID      | Suposição                                                           | Status     | Resolução                                                                                                                                                |
| ------- | ------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ASM-033 | A origem permitida é o próprio endereço do pedido, sem configuração | confirmada | Decisão técnica: funciona em desenvolvimento e em qualquer domínio publicado. Cadastrar domínio à mão é passo que se esquece e que só quebra em produção |
| ASM-034 | Pedido sem cabeçalho de origem é recusado                           | confirmada | Decisão técnica: o navegador manda origem em todo POST. Quem não manda é ferramenta de linha de comando, que é justamente o alvo                         |
| ASM-035 | O teto de tamanho do texto enviado é de 8000 caracteres             | confirmada | Decisão técnica: o maior texto do produto (diagnóstico com a conversa cheia) fica bem abaixo disso. O teto existe para o abuso, não para o uso           |
| ASM-036 | O limite de rajada é por endereço de rede DENTRO de cada instância  | confirmada | Decisão do dono do produto em 2026-08-23: sem armazenamento durável não há contagem confiável entre instâncias, e prometer mais seria pior que não ter   |
| ASM-037 | A recusa por rajada tem nome próprio, separado da cota do Gemini    | confirmada | Decisão técnica: são problemas diferentes com ações diferentes, e um nome só faria a pessoa esperar pela razão errada                                    |
| ASM-038 | A janela é de 5 minutos e o teto de 30 chamadas por endereço        | confirmada | Decisão técnica: uma sessão honesta faz um diagnóstico e algumas perguntas, bem abaixo disso. O limite morde a repetição automática, não a pessoa        |
| ASM-039 | A memória do contador é podada, para não crescer sem fim            | confirmada | Decisão técnica: um contador que só cresce vira vazamento de memória na instância, e o remédio não pode virar o problema                                 |

## Perguntas em aberto

| ID    | Pergunta                                                                                                     | Status     | Resposta                                                                                                                                             |
| ----- | ------------------------------------------------------------------------------------------------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q-010 | Migrar para contagem durável entre instâncias (Upstash, Vercel KV) para o limite de rajada valer de verdade? | respondida | Não nesta etapa: decisão do dono do produto em 2026-08-23. Custaria conta nova, variáveis novas e uma dependência, desproporcional ao volume de hoje |
