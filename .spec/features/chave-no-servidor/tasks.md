# Tasks: Chave no servidor

> feature: chave-no-servidor

<!--
  Ordem do arquivo = ordem de dependência. T-021 entrega o proxy; T-022 vira o
  cliente para ele; T-023 liga o proxy no servidor de desenvolvimento e na
  Vercel. Nenhuma roda em paralelo: T-022 depende do contrato que T-021 define,
  e T-023 depende dos dois.
  Status: pendente | em-andamento | concluida
-->

## T-021 — O proxy [concluida]

- Refs: US-018, AC-051, AC-053, AC-054
- Arquivos: src/server/gemini-proxy.ts, src/server/gemini-proxy.test.ts
- Modelo: claude-sonnet-5
- Esforço: alto
- Notas: `handleGeminiRequest(request: Request, apiKey: string | undefined): Promise<Response>`, escrito só com `Request`/`Response` do padrão web. Nada de tipos da Vercel aqui: é isso que permite o mesmo arquivo servir a função publicada, o middleware do Vite e o vitest sem nenhum adaptador no meio (ASM-029). O corpo aceito é `{ prompt: string, json?: boolean }` e a resposta de sucesso é `{ text: string }` (ASM-031). `json: true` liga o `responseMimeType: application/json` que o diagnóstico precisa e a conversa não. Método diferente de POST, corpo ilegível ou prompt vazio são recusados antes de qualquer chamada ao Gemini, porque pedido malformado não pode custar cota (AC-054). As falhas saem no corpo como `{ kind }`, com os mesmos nomes de `InsightErrorKind` (ASM-032) — inclusive `missing-key` quando o ambiente não tem chave. A chave nunca entra na resposta, nem em mensagem de erro.

## T-022 — O cliente pede ao próprio domínio [concluida]

- Refs: US-017, AC-049, AC-050, AC-052
- Arquivos: src/features/insights/gemini.ts, src/features/insights/gemini.test.ts, src/features/insights/chat.ts, src/features/insights/chat.test.ts, src/features/insights/proxy-double.ts, src/features/insights/chave-fora-do-cliente.test.ts, src/env.d.ts, src/features/insights/InsightPanel.test.tsx, src/features/insights/useInsight.test.tsx, src/features/insights/conversa-persistida.test.tsx, src/features/insights/InsightChat.test.tsx, src/routes/ResultPage.test.tsx, src/features/simulations/historico-navegacao.test.tsx
- Modelo: claude-sonnet-5
- Esforço: alto
- Notas: depende de T-021. `generateInsight` e `sendChatMessage` passam a chamar `/api/gemini`, sem cabeçalho de chave e sem endereço do Google. `config.ts` e `config.test.ts` são APAGADOS junto com `getGeminiApiKey`/`hasGeminiApiKey`: com a chave no servidor, não existe mais pergunta que o cliente possa responder sozinho sobre ela, e deixar a função ali seria convidar alguém a usá-la de novo. `VITE_GEMINI_API_KEY` sai do `env.d.ts` e de todo teste que a dublava com `vi.stubEnv` — o dublê agora é a resposta do proxy. `missing-key` deixa de ser decisão local e vira resposta lida do corpo (AC-052). O `proxy-double.ts` reúne o dublê do proxy num lugar só: sete suítes dublavam o Gemini e uma chave de ambiente, e deixá-las inventar o formato cada uma faria elas discordarem do contrato e continuarem passando. O teste do AC-049 varre o que EMBARCA no pacote (fora `src/server/` e fora dos testes) procurando leitura de chave, cabeçalho de chave e o endereço do Google: é a única prova que continua valendo se alguém reintroduzir a variável meses depois.

## T-023 — O proxy ligado ao Vite e à Vercel [concluida]

- Refs: US-019, AC-055
- Arquivos: api/gemini.ts, vite.config.ts, tsconfig.node.json, src/server/proxy-unico.test.ts, .env.example, README.md, onpspec.config.json
- Modelo: claude-sonnet-5
- Esforço: medio
- Notas: depende de T-021 e T-022. `api/gemini.ts` é o adaptador da Vercel e não deve ter lógica nenhuma: lê `process.env.GEMINI_API_KEY` e entrega a `handleGeminiRequest`. O plugin no `vite.config.ts` faz o mesmo para o `npm run dev`, montando um `Request` a partir do pedido do Node e escrevendo o `Response` de volta — o AC-055 exige que os dois cheguem ao MESMO módulo, e um mock de desenvolvimento escrito à parte reprova o critério. A chave do dev sai de `.env.local` sem prefixo, lida com `loadEnv` no config (que roda no Node, não no navegador). `.env.example` e o README trocam `VITE_GEMINI_API_KEY` por `GEMINI_API_KEY` e explicam por que o prefixo sumiu. `onpspec.config.json` ganha `src/server/**` e `api/**` nos `srcGlobs`, senão o proxy fica fora do alcance do audit, e `tsconfig.node.json` inclui `api` para o `api/gemini.ts` ser typechecado com os tipos do Node. O AC-055 é provado lendo os dois adaptadores como texto: subir um servidor de verdade custaria caro e provaria pouco, porque o erro que interessa é alguém escrever um SEGUNDO proxy, e isso se pega olhando de onde cada um tira a lógica.
