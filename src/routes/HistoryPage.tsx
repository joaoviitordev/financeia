import { useNavigate } from 'react-router-dom';

import { HistoryList } from '@/features/simulations/HistoryList';

/**
 * O histórico em página cheia (`/historico`).
 *
 * A mesma lista da sheet do cabeçalho, no mesmo componente (ASM-013): a sheet
 * é o acesso rápido de quem já está usando o app, e esta rota é o link direto
 * — o que se salva nos favoritos e o que cabe melhor na tela do celular.
 */
export function HistoryPage() {
  const navigate = useNavigate();

  return (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <header className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-title-1 text-label">Suas simulações</h1>
        <p className="text-body text-balance text-label-secondary">
          Tudo o que você concluiu neste dispositivo, da mais recente para a mais antiga.
        </p>
      </header>

      <HistoryList
        onOpen={(id) => {
          void navigate(`/resultado/${id}`);
        }}
        onStart={() => {
          void navigate('/');
        }}
      />
    </div>
  );
}
