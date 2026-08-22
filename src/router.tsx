import { createBrowserRouter, type RouteObject } from 'react-router-dom';

import App from '@/App';
import { ResultPage } from '@/routes/ResultPage';
import { SimulationPage } from '@/routes/SimulationPage';

/**
 * Árvore de rotas em separado do `router` construído a partir dela: os
 * testes reaproveitam `routes` num `createMemoryRouter`, e criar dois
 * `BrowserRouter` no mesmo processo dispara aviso do react-router.
 *
 * `/historico` ainda é placeholder — a tela de listagem está fora desta
 * trilha (etapa E10 do roteiro).
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <SimulationPage /> },
      { path: 'resultado/:id', element: <ResultPage /> },
      { path: 'historico', element: <p>Histórico em construção.</p> },
    ],
  },
];

export const router = createBrowserRouter(routes);
