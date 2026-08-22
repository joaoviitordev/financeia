import { useLocation, useNavigate } from 'react-router-dom';

import { Onboarding } from '@/features/onboarding/Onboarding';

/**
 * Tela da raiz (`/`): hospeda o fluxo de simulação.
 *
 * A `key={location.key}` é o que faz "nova simulação" limpar as respostas —
 * toda navegação para `/`, mesmo vindo de `/`, gera uma `location.key` nova
 * no react-router, e trocar a `key` remonta o `Onboarding` do zero.
 *
 * Quem sabe de rotas é esta tela, não o fluxo: o `Onboarding` guarda a
 * simulação ao concluir e só devolve o identificador; a navegação para o
 * resultado acontece aqui (AC-010).
 */
export function SimulationPage() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Onboarding
      key={location.key}
      onConcluded={(id) => {
        void navigate(`/resultado/${id}`);
      }}
    />
  );
}
