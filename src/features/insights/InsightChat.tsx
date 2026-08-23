import { ArrowUp, TriangleAlert } from 'lucide-react';
import { type KeyboardEvent, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { buildChatPrompt, sendChatMessage } from '@/features/insights/chat';
import type { ChatMessage } from '@/features/insights/chat-types';
import type { InsightFailure } from '@/features/insights/gemini';
import type { SimulationRecord } from '@/features/simulations/storage';

interface InsightChatProps {
  /** A simulação inteira: números, diagnóstico e conversa já guardada. */
  record: SimulationRecord;
  /** Avisa quem guarda o registro que a conversa mudou (AC-045). */
  onMessagesChange: (messages: ChatMessage[]) => void;
}

const TITLE = 'Converse sobre seu plano';

/** A pergunta que ainda não virou par: ou está em voo, ou falhou. */
type Pendente = { id: string; content: string; error: InsightFailure | null } | null;

function novaMensagem(role: ChatMessage['role'], content: string): ChatMessage {
  return { id: crypto.randomUUID(), role, content, createdAt: new Date().toISOString() };
}

/**
 * A conversa com o educador sobre a simulação.
 *
 * Card próprio, e não uma seção do painel do diagnóstico (ASM-020): aquele já
 * tem quatro estados mutuamente exclusivos, e enfiar a conversa lá dentro
 * dobraria a complexidade dele sem juntar nada que dependa um do outro.
 *
 * Carregando e erro são **por mensagem**, nunca do card inteiro (AC-047,
 * AC-048). É a diferença entre perder uma pergunta e perder a conversa: o
 * painel inteiro em estado de erro apagaria da tela tudo o que já foi dito,
 * que é justamente o que a pessoa não pode perder numa conexão ruim.
 *
 * O componente não conhece o armazenamento — avisa por `onMessagesChange` e
 * quem tem o registro em mãos decide o que gravar, como o `HistoryList` faz
 * com as rotas.
 */
export function InsightChat({ record, onMessagesChange }: InsightChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(record.messages ?? []);
  const [pendente, setPendente] = useState<Pendente>(null);
  const [rascunho, setRascunho] = useState('');
  const fimRef = useRef<HTMLDivElement>(null);

  const emVoo = pendente !== null && pendente.error === null;
  const podeEnviar = rascunho.trim() !== '' && !emVoo;

  // AC-044: a mensagem nova não adianta nada fora da área visível. O
  // `behavior` sai da preferência do sistema — quem pediu menos movimento
  // recebe o salto, não a animação.
  useEffect(() => {
    const preferMenosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    fimRef.current?.scrollIntoView({ behavior: preferMenosMovimento ? 'auto' : 'smooth' });
  }, [messages, pendente]);

  async function perguntar(pergunta: string) {
    const id = crypto.randomUUID();
    setPendente({ id, content: pergunta, error: null });

    const resultado = await sendChatMessage(buildChatPrompt({ ...record, messages }, pergunta));

    if (!resultado.ok) {
      // A pergunta fica na tela com o motivo e o caminho de volta; nada do que
      // já estava conversado é tocado (AC-048).
      setPendente({ id, content: pergunta, error: resultado.error });
      return;
    }

    const proximas = [
      ...messages,
      novaMensagem('user', pergunta),
      novaMensagem('assistant', resultado.content),
    ];
    setMessages(proximas);
    onMessagesChange(proximas);
    setPendente(null);
  }

  function enviar() {
    if (!podeEnviar) {
      return;
    }
    const pergunta = rascunho.trim();
    setRascunho('');
    void perguntar(pergunta);
  }

  // AC-042: Enter envia, Shift+Enter quebra linha. É por isso que o campo é
  // um textarea com onKeyDown, e não um form com input — num form o Enter
  // submete e a quebra de linha simplesmente não existe.
  function aoTeclar(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey) {
      return;
    }
    event.preventDefault();
    enviar();
  }

  return (
    <Card>
      <CardBody className="flex flex-col gap-4">
        <h2 className="text-title-3 text-label">
          <span aria-hidden="true">💬 </span>
          {TITLE}
        </h2>

        {messages.length === 0 && pendente === null ? (
          <p className="text-body text-label-secondary">
            Pergunte o que ficou em aberto no diagnóstico — o educador responde com os números desta
            simulação.
          </p>
        ) : null}

        {/* role="log" com aria-live: resposta que chega em silêncio é resposta
            perdida para quem usa leitor de tela. */}
        <ol role="log" aria-live="polite" aria-label="Conversa" className="flex flex-col gap-3">
          {messages.map((message) => (
            <li
              key={message.id}
              className={
                message.role === 'user'
                  ? 'max-w-[85%] self-end rounded-xl bg-accent-muted px-4 py-2'
                  : 'max-w-[85%] self-start rounded-xl bg-fill-quaternary px-4 py-2'
              }
            >
              <span className="sr-only">{message.role === 'user' ? 'Você:' : 'Educador:'}</span>
              <p className="text-body whitespace-pre-wrap text-label">{message.content}</p>
            </li>
          ))}

          {pendente !== null ? (
            <li className="flex max-w-[85%] flex-col gap-2 self-end">
              <div className="self-end rounded-xl bg-accent-muted px-4 py-2">
                <span className="sr-only">Você:</span>
                <p className="text-body whitespace-pre-wrap text-label">{pendente.content}</p>
              </div>

              {pendente.error === null ? (
                <p className="self-end text-footnote text-label-tertiary">Escrevendo a resposta…</p>
              ) : (
                <div className="flex flex-col items-end gap-2">
                  <p className="flex items-start gap-2 text-footnote text-critical">
                    <TriangleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                    {pendente.error.message}
                  </p>
                  <Button
                    variant="gray"
                    size="sm"
                    onClick={() => {
                      void perguntar(pendente.content);
                    }}
                  >
                    Tentar de novo
                  </Button>
                </div>
              )}
            </li>
          ) : null}
        </ol>

        <div ref={fimRef} />

        <div className="flex items-end gap-2">
          <textarea
            aria-label="Sua pergunta"
            placeholder="ex: e se eu cortar o aluguel?"
            rows={2}
            value={rascunho}
            onChange={(event) => {
              setRascunho(event.target.value);
            }}
            onKeyDown={aoTeclar}
            className={[
              'w-full resize-none rounded-xl border border-separator bg-fill-quaternary px-4 py-3',
              'text-body text-label outline-none placeholder:text-label-tertiary',
              'transition-[border-color,box-shadow] duration-150',
              'focus:border-accent focus:shadow-[0_0_0_3.5px_var(--focus-ring)] focus-visible:shadow-[0_0_0_3.5px_var(--focus-ring)]',
            ].join(' ')}
          />
          <Button aria-label="Enviar pergunta" disabled={!podeEnviar} onClick={enviar}>
            <ArrowUp aria-hidden="true" className="h-4 w-4" />
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
