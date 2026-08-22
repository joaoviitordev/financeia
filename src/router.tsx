import { createBrowserRouter, type RouteObject } from 'react-router-dom';

import App from '@/App';
import { HistoryPage } from '@/routes/HistoryPage';
import { ResultPage } from '@/routes/ResultPage';
import { SimulationPage } from '@/routes/SimulationPage';

/**
 * Árvore de rotas em separado do `router` construído a partir dela: os
 * testes reaproveitam `routes` num `createMemoryRouter`, e criar dois
 * `BrowserRouter` no mesmo processo dispara aviso do react-router.
 *
 * Três rotas: a simulação na raiz, o resultado por id e o histórico.
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <SimulationPage /> },
      { path: 'resultado/:id', element: <ResultPage /> },
      { path: 'historico', element: <HistoryPage /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
