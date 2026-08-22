import { History } from 'lucide-react';
import { useState } from 'react';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { Sheet } from '@/components/ui/Sheet';
import { Onboarding } from '@/features/onboarding/Onboarding';

/**
 * Casca da aplicação: cabeçalho fixo, conteúdo cresce, rodapé encosta embaixo.
 *
 * Header e Footer moram aqui, e não dentro de cada tela, para aparecerem em
 * todas sem que nenhuma precise lembrar de incluí-los.
 */
function App() {
  // Trocar a `key` remonta o Onboarding, e remontar já devolve o fluxo à
  // apresentação com as respostas limpas. É o mesmo efeito do `restart` que o
  // hook expõe, sem precisar levantar a máquina de estados inteira para cá só
  // para alcançá-la de fora — a tela continua dona do próprio estado.
  const [simulation, setSimulation] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <div className="flex min-h-dvh flex-col bg-grouped">
      <Header
        onNewSimulation={() => {
          setSimulation((current) => current + 1);
        }}
        onShowHistory={() => {
          setHistoryOpen(true);
        }}
      />

      <main className="flex flex-1 justify-center px-4 py-10 md:py-16">
        <Onboarding key={simulation} />
      </main>

      <Footer />

      <Sheet open={historyOpen} onOpenChange={setHistoryOpen} title="Histórico">
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <History aria-hidden="true" className="h-9 w-9 text-label-tertiary" strokeWidth={1.5} />
          <p className="text-headline text-label">Nenhuma simulação guardada</p>
          <p className="text-subheadline text-balance text-label-secondary">
            As respostas vivem enquanto esta aba está aberta e somem ao recarregar a página. Como
            nada é gravado no dispositivo, não há o que listar aqui.
          </p>
        </div>
      </Sheet>
    </div>
  );
}

export default App;
