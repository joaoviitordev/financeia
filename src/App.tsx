import { History } from 'lucide-react';
import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { Sheet } from '@/components/ui/Sheet';

/**
 * Casca da aplicação: cabeçalho fixo, conteúdo cresce, rodapé encosta embaixo.
 *
 * Header e Footer moram aqui, e não dentro de cada tela, para aparecerem em
 * todas sem que nenhuma precise lembrar de incluí-los. O conteúdo em si é a
 * rota ativa, renderizada pelo `<Outlet />`.
 */
function App() {
  const navigate = useNavigate();
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <div className="flex min-h-dvh flex-col bg-grouped">
      <Header
        onNewSimulation={() => {
          // Navegar para `/` — mesmo já estando lá — gera uma `location.key`
          // nova, e é essa troca que remonta a `SimulationPage` com as
          // respostas limpas.
          navigate('/');
        }}
        onShowHistory={() => {
          setHistoryOpen(true);
        }}
      />

      <main className="flex flex-1 justify-center px-4 py-10 md:py-16">
        <Outlet />
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
