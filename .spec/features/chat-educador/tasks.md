# Tasks: Chat educador

> feature: chat-educador

<!--
  Ordem do arquivo = ordem de dependência. T-017 e T-018 tocam arquivos
  disjuntos e podem correr em paralelo; T-019 depende das duas, e T-020
  depende de T-019.
  Status: pendente | em-andamento | concluida
-->

## T-017 — A conversa no armazenamento [concluida]

- Refs: US-015, AC-045, AC-046
- Arquivos: src/features/insights/chat-types.ts, src/features/insights/chat-types.test.ts, src/features/simulations/storage.ts, src/features/simulations/storage.test.ts
- Modelo: claude-sonnet-5
- Esforço: medio
- Notas: `ChatMessage = { id, role: 'user' | 'assistant', content, createdAt }` e o guardião `isChatMessage`, no molde do `isInsightData` — o armazenamento é hostil e a conversa vem dele. `SimulationRecord` ganha `messages?: ChatMessage[]` (ASM-025) e `SimulationPatch` passa a aceitá-lo, para que `messages: undefined` descarte a conversa do mesmo jeito que `insight: undefined` descarta o diagnóstico (AC-046). Uma mensagem corrompida custa a conversa daquele registro, nunca o registro nem a lista (ASM-026): mesmo tratamento do `withValidInsight`, que já está ali ao lado e deve ser o modelo. A ordem das mensagens é a de gravação — aqui não há reordenação por data, ao contrário da lista do histórico.

## T-018 — O pedido de acompanhamento [concluida]

- Refs: US-013, AC-040, AC-041
- Arquivos: src/features/insights/chat.ts, src/features/insights/chat.test.ts
- Modelo: claude-sonnet-5
- Esforço: alto
- Notas: independente de T-017 — pode correr em paralelo. Duas coisas: `buildChatPrompt(plan, insight, messages)`, que monta o texto com os números da simulação, o diagnóstico já gerado e a conversa recente (AC-040), e `sendChatMessage(prompt)`, que fala com o Gemini. Os números chegam prontos do `buildPlan`, como manda o `prompt.ts` que já existe — a IA nunca faz conta. O corte de contexto é das 10 últimas mensagens (ASM-023, AC-041) e mora aqui, não no componente: é uma regra do pedido. A chamada NÃO pode reusar `generateInsight`, que força `responseMimeType: application/json` e devolve `InsightData` — a resposta aqui é prosa (ASM-024). Reaproveite `getGeminiApiKey`, o mesmo `InsightErrorKind` e o mesmo header `x-goog-api-key`: as causas de falha são as mesmas, e dar nome novo a elas seria inventar vocabulário.

## T-019 — O painel da conversa [concluida]

- Refs: US-013, US-014, US-016, AC-039, AC-042, AC-043, AC-044, AC-047, AC-048
- Arquivos: src/features/insights/InsightChat.tsx, src/features/insights/InsightChat.test.tsx
- Modelo: claude-sonnet-5
- Esforço: alto
- Notas: depende de T-017 e T-018. Card próprio (ASM-020), recebendo por props a simulação e o diagnóstico — quem conhece o armazenamento é quem o usa, como no `HistoryList`. Carregando e erro são **por mensagem**, não do painel inteiro (AC-047, AC-048): a pergunta que falhou guarda o próprio estado e o próprio botão de reenviar, e as anteriores continuam intactas. Enter envia e Shift+Enter quebra linha (AC-042) — logo o campo é `textarea` com `onKeyDown`, nunca um `form` com `input`. Envio bloqueado com campo vazio ou pergunta em voo (AC-043). A rolagem até a mensagem nova usa `scrollIntoView` com `behavior` decidido por `prefers-reduced-motion` (AC-044), do mesmo jeito que o resto do produto respeita a preferência. A lista de mensagens precisa ser anunciável por leitor de tela — resposta que chega em silêncio é resposta perdida, e o `InsightPanel` já mostra como (`role="status"`).

## T-020 — A conversa na página de resultado [concluida]

- Refs: US-013, US-015, AC-038, AC-045, AC-046
- Arquivos: src/routes/ResultPage.tsx, src/routes/ResultPage.test.tsx, src/features/insights/conversa-persistida.test.tsx, src/features/insights/InsightPanel.tsx, src/features/onboarding/useOnboarding.ts
- Modelo: claude-sonnet-5
- Esforço: alto
- Notas: depende de T-019. O card entra abaixo do `InsightPanel` e só é montado quando há diagnóstico na tela (AC-038, ASM-021) — carregando, erro e falta de chave não rendem conversa. Cada mensagem gravada no registro assim que existe, para a conversa sobreviver ao reload (AC-045). Concluir de novo com uma resposta alterada limpa `messages` junto com `insight` (AC-046): o caminho já existe para o diagnóstico desde o AC-026, e o que falta é a conversa entrar nele. O painel avisa por `onInsightChange` um BOOLEANO, não o diagnóstico: o `useInsight` relê o armazenamento a cada render, e devolver o objeto faria a página guardar um estado sempre "diferente", re-renderizar e disparar o efeito de novo, sem fim. O teste do AC-045 prova pela releitura do armazenamento, não pelo estado do React — estado sobrevive à remontagem por acidente, armazenamento sobrevive de propósito.
