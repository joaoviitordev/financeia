# Tasks: Proxy com limite

> feature: proxy-com-limite

<!--
  Ordem do arquivo = ordem de dependência. T-024 põe as barreiras no proxy;
  T-025 faz a tela explicar a recusa. Não rodam em paralelo: T-025 depende do
  nome que T-024 dá à recusa.
  Status: pendente | em-andamento | concluida
-->

## T-024 — As três barreiras no proxy [concluida]

- Refs: US-020, US-021, US-022, AC-056, AC-057, AC-058, AC-059, AC-060
- Arquivos: src/server/gemini-proxy.ts, src/server/gemini-proxy.test.ts, vite.config.ts
- Modelo: claude-sonnet-5
- Esforço: alto
- Notas: as três entram ANTES da chamada ao Gemini e antes até da leitura da chave, porque recusa que custa cota não é recusa. **Origem**: compara o cabeçalho `Origin` com o host do próprio pedido (ASM-033); iguais, passa; diferentes ou ausente, `forbidden-origin`. Comparar host, e não a URL inteira, porque esquema e porta variam entre desenvolvimento e produção. **Tamanho**: prompt acima de 8000 caracteres vira `bad-request` (ASM-035), medido antes de qualquer coisa cara. **Rajada**: janela deslizante de 5 minutos, 30 chamadas por endereço de rede (ASM-038), com o endereço lido de `x-forwarded-for` e caindo para um balde único quando o cabeçalho não vier. O mapa é podado a cada passagem (ASM-039): contador que só cresce é vazamento de memória, e o remédio não pode virar o problema. O estado vive em escopo de módulo, o que o torna por instância e por isso melhor esforço, exatamente como a ASM-036 admite. O `vite.config.ts` entra aqui porque hoje ele monta o `Request` com uma URL fixa `http://localhost/api/gemini`: com a checagem de origem isso reprovaria todo pedido em desenvolvimento, já que o navegador manda `localhost:5173`. Passa a montar a URL a partir do `host` e do `originalUrl` do pedido do Node.

## T-025 — A tela explica a recusa [concluida]

- Refs: US-022, AC-061
- Arquivos: src/features/insights/gemini.ts, src/features/insights/gemini.test.ts, src/features/insights/InsightPanel.test.tsx, src/features/insights/InsightChat.test.tsx, api/gemini.ts, tsconfig.api.json, tsconfig.json, tsconfig.node.json
- Modelo: claude-sonnet-5
- Esforço: medio
- Notas: depende de T-024. `InsightErrorKind` ganha `rate-limited`, com texto próprio dizendo que foram muitos pedidos em pouco tempo e que é para esperar um instante (ASM-037). Não pode reusar o texto de `quota`: cota da API esgotada e rajada contida pedem esperas de ordem de grandeza diferente, e um texto só faria a pessoa esperar pela razão errada. `forbidden-origin` NÃO ganha texto próprio: ela nunca acontece com quem usa o site de verdade, e cai no genérico junto com o resto do que o cliente não conhece. O painel e a conversa não mudam de código: os dois já mostram `error.message`, e é por isso que acrescentar uma causa custa uma linha em vez de um estado novo.

  **Entrou aqui por necessidade, não por planejamento:** o build da Vercel quebrou no meio desta tarefa, com erros que o build local não pegava. O `api/` estava sob o `tsconfig.node.json`, com resolução `nodenext` e tipos do Node, e a Vercel não usa nenhum dos dois. Nasceu o `tsconfig.api.json`, deliberadamente MAIS restrito que o nosso (`moduleResolution: bundler`, `types: []`), para que o erro apareça aqui antes de aparecer lá. O `api/gemini.ts` passou a importar sem a extensão `.ts` e a ler a variável de ambiente pelo `globalThis`, porque o runtime de borda tem `process` mas não tem os tipos dele.
