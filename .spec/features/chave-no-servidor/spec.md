# Spec: Chave no servidor

> feature: chave-no-servidor
> status: auditada

<!--
  Como ler este arquivo (o formato é verificado por `onp-spec audit`):
  - US-xxx = história de usuário · AC-xxx = critério de aceite
    ASM-xxx = suposição · Q-xxx = pergunta em aberto
    São códigos de rastreio: ligam a especificação às tarefas e aos testes.
-->

## Contexto

Hoje a chave do Gemini tem o prefixo `VITE_`, e prefixo `VITE_` significa uma coisa só: a variável é
embutida no pacote que o navegador baixa. Qualquer pessoa que abra as ferramentas de desenvolvedor
lê a chave e passa a gastar a cota de quem publicou. Isso era aceitável enquanto o aplicativo só
rodava na máquina de quem o escreveu, e a ASM-007 registrou isso por escrito. Deixou de ser: o chat
multiplicou as chamadas por sessão, e o próximo passo do projeto é publicar.

Esta feature move a chave para o servidor. O navegador passa a pedir ao próprio domínio, sem chave
nenhuma, e quem fala com o Google é uma função que roda fora do alcance de quem usa o site.

## Histórias

### US-017 — A chave não vai para o navegador

Como dono da chave, quero que ela não seja publicada junto com o site, para não pagar a conta do uso
de estranhos.

#### AC-049 — Nenhum módulo do cliente lê a chave

- **Dado** o código que o navegador baixa
- **Quando** procuro por leitura de chave nele
- **Então** nenhum arquivo que embarca no pacote lê variável de ambiente com chave, manda cabeçalho
  de chave, ou fala direto com o endereço do Google

#### AC-050 — O cliente pede ao próprio domínio, sem chave

- **Dado** uma geração de diagnóstico ou uma pergunta na conversa
- **Quando** o pedido sai do navegador
- **Então** ele vai para `/api/gemini`, no mesmo domínio, e nem o cabeçalho nem o corpo carregam
  qualquer chave

### US-018 — O proxy guarda a chave e responde pelo nome

Como pessoa usando o aplicativo, quero que uma falha de configuração ou de cota continue explicada em
português na tela, para saber o que fazer em vez de encarar uma tela quebrada.

#### AC-051 — O proxy fala com o Gemini usando a chave do ambiente

- **Dado** o proxy com a chave configurada no ambiente do servidor
- **Quando** ele recebe um pedido do navegador
- **Então** repassa ao Gemini com a chave no cabeçalho, e devolve ao navegador só o texto da
  resposta, sem a chave

#### AC-052 — Sem a chave no ambiente, a tela continua explicando o que falta

- **Dado** o servidor sem a chave configurada
- **Quando** a página de resultado tenta gerar o diagnóstico
- **Então** o painel explica que falta configurar a chave, e os números da simulação continuam na
  tela

#### AC-053 — Chave recusada e cota estourada chegam à tela com o nome de sempre

- **Dado** o Gemini recusando a chave ou acusando cota estourada
- **Quando** a resposta chega ao navegador
- **Então** a tela mostra a mesma explicação de antes para cada caso, sem trocar o motivo por "erro
  inesperado"

#### AC-054 — O proxy só atende o que ele existe para atender

- **Dado** um pedido ao proxy que não é um POST com prompt
- **Quando** ele chega
- **Então** é recusado sem tocar no Gemini e sem gastar cota

### US-019 — Desenvolvimento e produção falam a mesma língua

Como quem programa neste projeto, quero que `npm run dev` use o mesmo proxy da produção, para não
descobrir um erro só depois de publicar.

#### AC-055 — O servidor de desenvolvimento serve o mesmo proxy

- **Dado** o `npm run dev` rodando com a chave no ambiente
- **Quando** o navegador pede `/api/gemini`
- **Então** responde o mesmo código que responde em produção, e não uma imitação escrita à parte

## Fora de escopo

- **Limitar quem pode chamar o proxy.** Depois desta feature a chave está protegida, mas o endereço
  `/api/gemini` fica aberto a quem souber dele, e a cota continua sendo a de quem publicou. Limite
  por origem, por IP ou por sessão é assunto de outra etapa (ASM-030).
- Guardar histórico de uso ou custo por chamada.
- Cache de respostas no servidor: o cache que importa continua sendo o do registro da simulação.
- Trocar o modelo ou o provedor.
- Publicar de fato: esta feature deixa o projeto pronto para publicar, e apertar o botão é do dono.

## Suposições

| ID      | Suposição                                                                         | Status     | Resolução                                                                                                                            |
| ------- | --------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| ASM-027 | A variável passa a se chamar `GEMINI_API_KEY`, sem prefixo                        | confirmada | Decisão técnica: o prefixo `VITE_` é exatamente o mecanismo que manda a variável para o pacote do navegador                          |
| ASM-028 | O proxy roda como função da Vercel, em `api/`                                     | confirmada | Decisão do dono do produto em 2026-08-23: é o caminho mais curto para um SPA Vite e não exige arquivo de configuração                |
| ASM-029 | A lógica mora em `src/server/`, e `api/gemini.ts` é só o adaptador                | confirmada | Decisão técnica: é o que faz desenvolvimento e produção rodarem o mesmo código (AC-055) e o que deixa o proxy sob o vitest de hoje   |
| ASM-030 | O proxy não autentica nem limita taxa nesta etapa                                 | confirmada | Decisão técnica: a feature resolve o vazamento da chave, que é o risco maior. O endereço aberto fica registrado no fora de escopo    |
| ASM-031 | O contrato entre navegador e proxy é `{ prompt, json }` e a resposta é `{ text }` | confirmada | Decisão técnica: o proxy não conhece diagnóstico nem conversa, só sabe pedir texto. Quem interpreta o texto continua sendo o cliente |
| ASM-032 | As causas de falha continuam com os nomes de hoje (`InsightErrorKind`)            | confirmada | Decisão técnica: a tela já fala essa língua, e trocar o vocabulário faria a mesma falha ter dois nomes                               |

## Perguntas em aberto

| ID    | Pergunta | Status     | Resposta                                                                                        |
| ----- | -------- | ---------- | ----------------------------------------------------------------------------------------------- |
| Q-009 | Nenhuma. | respondida | As decisões desta feature couberam nas suposições acima, todas confirmadas antes de implementar |
