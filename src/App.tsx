import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { Sheet } from '@/components/ui/Sheet';
import { HistoryList } from '@/features/simulations/HistoryList';

/**
 * Casca da aplicação: cabeçalho fixo, conteúdo cresce, rodapé encosta embaixo.
 *
 * Header e Footer moram aqui, e não dentro de cada tela, para aparecerem em
 * todas sem que nenhuma precise lembrar de incluí-los. O conteúdo em si é a
 * rota ativa, renderizada pelo `<Outlet />`.
 */
function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [historyOpen, setHistoryOpen] = useState(false);

  const goTo = (path: string) => {
    setHistoryOpen(false);
    void navigate(path);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-grouped">
      <Header
        onNewSimulation={() => {
          // Navegar para `/` — mesmo já estando lá — gera uma `location.key`
          // nova, e é essa troca que remonta a `SimulationPage` com as
          // respostas limpas.
          void navigate('/');
        }}
        onShowHistory={() => {
          setHistoryOpen(true);
        }}
      />

      {/* O respiro vertical encolhe com a altura da janela: fixo em 64px ele
          empurrava o passo do questionário para fora da tela e criava barra de
          rolagem em conteúdo que cabia. Em tela alta continua generoso. */}
      <main className="flex flex-1 justify-center px-4 py-[clamp(1rem,4vh,4rem)]">
        <Outlet />
      </main>

      <Footer />

      <Sheet open={historyOpen} onOpenChange={setHistoryOpen} title="Histórico">
        <HistoryList
          onOpen={(id) => {
            goTo(`/resultado/${id}`);
          }}
          onStart={() => {
            goTo('/');
          }}
          onDeleted={(ids) => {
            // Apagou justamente a simulação que está na tela: ficar ali seria
            // mostrar números de algo que deixou de existir (ASM-017).
            if (ids.some((id) => location.pathname === `/resultado/${id}`)) {
              goTo('/');
            }
          }}
        />
      </Sheet>
    </div>
  );
}

export default App;
