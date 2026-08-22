import { useLocation } from 'react-router-dom';

import { Onboarding } from '@/features/onboarding/Onboarding';

/**
 * Tela da raiz (`/`): hospeda o fluxo de simulação.
 *
 * A `key={location.key}` é o que faz "nova simulação" limpar as respostas —
 * toda navegação para `/`, mesmo vindo de `/`, gera uma `location.key` nova
 * no react-router, e trocar a `key` remonta o `Onboarding` do zero.
 */
export function SimulationPage() {
  const location = useLocation();

  return <Onboarding key={location.key} />;
}
