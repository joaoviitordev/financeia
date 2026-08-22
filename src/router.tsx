import { createBrowserRouter, type RouteObject } from 'react-router-dom';

import App from '@/App';
import { SimulationPage } from '@/routes/SimulationPage';

/**
 * Árvore de rotas em separado do `router` construído a partir dela: os
 * testes reaproveitam `routes` num `createMemoryRouter`, e criar dois
 * `BrowserRouter` no mesmo processo dispara aviso do react-router.
 *
 * `/resultado/:id` e `/historico` ainda são placeholders — ganham conteúdo
 * em T-004 e numa etapa fora desta trilha, respectivamente.
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <SimulationPage /> },
      { path: 'resultado/:id', element: <p>Resultado em construção.</p> },
      { path: 'historico', element: <p>Histórico em construção.</p> },
    ],
  },
];

export const router = createBrowserRouter(routes);
