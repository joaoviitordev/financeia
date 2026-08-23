import { Outlet, useNavigate } from 'react-router-dom';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';

/**
 * Casca da aplicação: cabeçalho fixo, conteúdo cresce, rodapé encosta embaixo.
 *
 * Header e Footer moram aqui, e não dentro de cada tela, para aparecerem em
 * todas sem que nenhuma precise lembrar de incluí-los. O conteúdo em si é a
 * rota ativa, renderizada pelo `<Outlet />`.
 */
function App() {
  const navigate = useNavigate();

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
          void navigate('/historico');
        }}
      />

      {/* O respiro vertical encolhe com a altura da janela: fixo em 64px ele
          empurrava o passo do questionário para fora da tela e criava barra de
          rolagem em conteúdo que cabia. Em tela alta continua generoso. */}
      <main className="flex flex-1 justify-center px-4 py-[clamp(1rem,4vh,4rem)]">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export default App;
