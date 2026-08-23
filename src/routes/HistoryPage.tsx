import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { HistoryList } from '@/features/simulations/HistoryList';

/**
 * O histórico em página cheia (`/historico`).
 *
 * Casa única da lista (ASM-013): é para cá que o botão do cabeçalho leva, e é
 * este o endereço que se salva nos favoritos e se manda por link. Uma sheet
 * sobreposta chegou a existir aqui, e sair dela foi o que tirou da tela duas
 * portas para a mesma lista.
 *
 * Em compensação, a sheet devolvia a pessoa ao lugar de onde ela veio só de
 * fechar — uma página cheia, não. Daí o botão de voltar (AC-037): quem estava
 * no meio de uma conversa sobre uma simulação volta para ela, não para o
 * começo.
 */
export function HistoryPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // `key === 'default'` é a primeira entrada da pilha: chegou por link direto,
  // favorito ou recarregando a página. Aí não há para onde voltar, e mandar
  // para a apresentação é melhor do que um botão morto ou um passo para fora
  // do aplicativo.
  const veioDeOutraTela = location.key !== 'default';

  return (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <div className="flex">
        <Button
          variant="plain"
          onClick={() => {
            if (veioDeOutraTela) {
              void navigate(-1);
              return;
            }
            void navigate('/');
          }}
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Voltar
        </Button>
      </div>

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
