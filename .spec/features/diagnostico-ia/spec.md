# Spec: Diagnóstico com IA

> feature: diagnostico-ia
> status: auditada

## Contexto

A página de resultado hoje mostra os números da simulação e para por aí: quem lê descobre quanto
sobra por mês, mas não se a meta cabe no orçamento nem o que mudar para caber. Esta feature põe no
lugar do placeholder um diagnóstico escrito por IA a partir dos próprios números da simulação —
gerado uma vez, guardado junto com ela e explicado enquanto carrega ou quando falha. Corresponde
às etapas E5 a E9 de `docs/roteiro-planejai.md`.

## Histórias

### US-005 — Um diagnóstico que fala a minha língua

Como pessoa que acabou de simular, quero ler uma análise das minhas contas em português claro, para
entender se o objetivo cabe no meu orçamento e o que fazer a respeito.

#### AC-013 — O diagnóstico chega em seis seções

- **Dado** um diagnóstico gerado para a minha simulação
- **Quando** a página de resultado termina de carregá-lo
- **Então** vejo as seis seções na ordem: viabilidade, diagnóstico, sugestões, renda extra,
  investimentos e mensagem final

#### AC-014 — O selo de viabilidade diz em texto o que a cor diz

- **Dado** um diagnóstico com viabilidade "meta viável", "ajuste necessário" ou "meta inviável"
- **Quando** o painel é exibido
- **Então** o selo traz o rótulo escrito por extenso, e não apenas a cor, em cada um dos três casos

#### AC-015 — Viabilidade desconhecida não quebra a tela

- **Dado** um diagnóstico cuja viabilidade veio com um valor que o aplicativo não conhece
- **Quando** o painel é exibido
- **Então** as demais seções aparecem normalmente, sem selo e sem erro na tela

#### AC-016 — Seção sem itens não deixa título órfão

- **Dado** um diagnóstico em que a lista de renda extra veio vazia
- **Quando** o painel é exibido
- **Então** o título dessa seção não aparece, e as seções com conteúdo continuam visíveis

### US-006 — O texto conversa com os números que estão na tela

Como pessoa lendo o diagnóstico, quero que ele use exatamente os valores que vejo nos cards, para
não ter que decidir em qual dos dois acreditar.

#### AC-017 — O pedido à IA carrega os números da simulação

- **Dado** uma simulação com renda, gastos fixos, dívidas, guardado, objetivo, custo e prazo
- **Quando** o pedido à IA é montado
- **Então** ele contém esses valores e o formato de resposta esperado; mudar qualquer valor da
  simulação muda o pedido

#### AC-018 — A viabilidade sai da conta, não da opinião da IA

- **Dado** o saldo mensal que sobra depois da reserva de emergência
- **Quando** a viabilidade é determinada
- **Então** saldo positivo ou zero é "meta viável", saldo negativo até 20% da economia necessária é
  "ajuste necessário", e negativo acima disso é "meta inviável" — sempre pela conta, mesmo que a IA
  responda outra coisa

### US-007 — A espera e a falha são explicadas

Como pessoa com internet instável ou sem chave configurada, quero saber o que está acontecendo,
para não olhar para uma tela parada sem entender se quebrou.

#### AC-019 — Enquanto o diagnóstico não chega, a tela mostra que está vindo

- **Dado** que o diagnóstico está sendo gerado
- **Quando** olho a página de resultado
- **Então** vejo o título do painel e um esqueleto de carregamento, e o painel se anuncia como
  ocupado para leitores de tela

#### AC-020 — Cada falha é dita pelo nome, com caminho de volta

- **Dado** que a geração falhou por chave inválida, por cota estourada ou por falha de rede
- **Quando** o painel mostra o erro
- **Então** a mensagem corresponde à causa e existe um botão que tenta gerar de novo

#### AC-021 — Nunca dois estados ao mesmo tempo

- **Dado** qualquer momento do painel de diagnóstico
- **Quando** olho a tela
- **Então** vejo carregamento, erro ou conteúdo — nunca dois deles juntos

#### AC-022 — Sem chave configurada, o aplicativo continua de pé

- **Dado** que nenhuma chave de API foi configurada
- **Quando** abro a página de resultado
- **Então** os números da simulação aparecem normalmente e o painel explica que falta configurar a
  chave, sem erro de rede na tela

### US-008 — Gerado uma vez, guardado com a simulação

Como pessoa que volta à mesma simulação, quero que o diagnóstico já esteja lá, para não esperar de
novo nem gastar uma chamada à toa.

#### AC-023 — Uma conclusão, uma chamada

- **Dado** que concluí uma simulação e o resultado abriu
- **Quando** o diagnóstico é gerado
- **Então** a API é chamada uma única vez, mesmo com a tela renderizando duas vezes em
  desenvolvimento

#### AC-024 — Reabrir a simulação não chama a API

- **Dado** uma simulação cujo diagnóstico já foi guardado
- **Quando** abro o endereço de resultado dela de novo
- **Então** vejo o diagnóstico guardado sem nenhuma chamada à API

#### AC-025 — Resposta fora do formato vira erro tratado, não tela branca

- **Dado** que a IA respondeu com um JSON embrulhado em cerca de código, ou com algo que não é o
  formato esperado
- **Quando** a resposta é lida
- **Então** a cerca é removida e o conteúdo válido é exibido; o que não for válido vira o estado de
  erro com o botão de tentar de novo

#### AC-026 — Mudar uma resposta refaz o diagnóstico

- **Dado** uma simulação com diagnóstico guardado
- **Quando** volto, altero uma resposta e concluo de novo
- **Então** o diagnóstico guardado é descartado e um novo é gerado para os números novos

## Fora de escopo

- Tela de histórico com listagem e exclusão (etapa E10 do roteiro).
- Conversa com o educador financeiro (etapa E11).
- Proxy serverless para esconder a chave e qualquer publicação do site (ver ASM-007 e Q-003).
- Resposta em fluxo (streaming) — o diagnóstico chega inteiro ou não chega.
- Qualquer mudança no cálculo do plano, nas perguntas ou no design system além do que o painel
  precisar.

## Suposições

| ID      | Suposição                                                                                                                    | Status     | Resolução                                                                                                            |
| ------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------- |
| ASM-006 | O diagnóstico é gerado pelo Gemini Flash, por chamada HTTP direta, sem SDK novo no projeto                                   | confirmada | Decisão do dono do produto em 2026-08-22, alinhada à etapa E6 do roteiro                                             |
| ASM-007 | A chave vai para o navegador com prefixo `VITE_` e, portanto, para o pacote publicado — aceitável enquanto o app roda local  | confirmada | Decisão do dono do produto em 2026-08-22: projeto de estudo rodando local (ver Q-003 antes de publicar)              |
| ASM-008 | Sem chave configurada, o painel avisa em vez de sumir                                                                        | confirmada | Decisão do dono do produto em 2026-08-22                                                                             |
| ASM-009 | O diagnóstico é guardado dentro do próprio registro da simulação, num campo novo, e o armazenamento aceita registros sem ele | confirmada | Decisão técnica (roteiro E7): é o que faz reabrir a simulação sair de graça, sem uma segunda chave no storage        |
| ASM-010 | A viabilidade exibida é sempre a calculada pelo aplicativo, mesmo quando a IA devolve outra                                  | confirmada | Decisão técnica (roteiro E5): critério objetivo não pode depender do julgamento de um modelo probabilístico          |
| ASM-011 | O diagnóstico é pedido quando a página de resultado abre, não ao confirmar a última pergunta                                 | confirmada | Decisão técnica (roteiro E7): assim o endereço compartilhado gera o diagnóstico de quem abre, não só de quem simulou |
| ASM-012 | Concluir de novo a mesma simulação descarta o diagnóstico guardado                                                           | confirmada | Decisão do dono do produto em 2026-08-22: texto velho ao lado de números novos é o pior resultado possível           |

## Perguntas em aberto

| ID    | Pergunta                                                                                             | Status     | Resposta                                                                                                                              |
| ----- | ---------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Q-003 | Publicar o site com a chave no pacote expõe a chave a qualquer visitante. Quando isso vira problema? | respondida | Enquanto o app rodar apenas local, é o custo aceito. Antes de qualquer publicação, a chave precisa ir para um proxy — feature própria |
| Q-004 | Qual identificador de modelo usar, já que os apelidos do Gemini mudam?                               | respondida | Começar por `gemini-flash-latest`; se o apelido não responder, fixar um modelo explícito da lista do AI Studio                        |
