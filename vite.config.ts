import type { IncomingMessage, ServerResponse } from 'node:http';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv, type Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

import { handleGeminiRequest } from './src/server/gemini-proxy.ts';

/** O corpo do pedido, que no Node chega em pedaços. */
async function lerCorpo(req: IncomingMessage): Promise<Buffer> {
  const pedacos: Buffer[] = [];
  for await (const pedaco of req) {
    pedacos.push(pedaco as Buffer);
  }

  return Buffer.concat(pedacos);
}

function cabecalhos(req: IncomingMessage): Headers {
  const headers = new Headers();
  for (const [nome, valor] of Object.entries(req.headers)) {
    if (typeof valor === 'string') {
      headers.set(nome, valor);
    }
  }

  return headers;
}

/**
 * O proxy do Gemini durante o `npm run dev`.
 *
 * O servidor do Vite não roda a pasta `api/`, então sem este plugin o
 * desenvolvimento precisaria de um proxy próprio — e proxy próprio é como
 * desenvolvimento e produção passam a divergir sem ninguém notar. Aqui o
 * pedido do Node é convertido para um `Request` do padrão web e entregue ao
 * MESMO módulo que a função publicada chama (AC-055).
 *
 * A chave sai de `GEMINI_API_KEY`, lida pelo `loadEnv` com prefixo vazio. Este
 * arquivo roda no Node, nunca no navegador: é o único lugar do projeto onde ler
 * uma variável sem prefixo `VITE_` é seguro.
 */
function geminiProxyDev(apiKey: string | undefined): Plugin {
  return {
    name: 'gemini-proxy-dev',
    configureServer(server) {
      server.middlewares.use('/api/gemini', (req: IncomingMessage, res: ServerResponse) => {
        void (async () => {
          const corpo = await lerCorpo(req);
          const request = new Request('http://localhost/api/gemini', {
            method: req.method ?? 'GET',
            headers: cabecalhos(req),
            ...(req.method === 'GET' || req.method === 'HEAD' ? {} : { body: corpo }),
          });

          const response = await handleGeminiRequest(request, apiKey);

          res.statusCode = response.status;
          response.headers.forEach((valor, nome) => {
            res.setHeader(nome, valor);
          });
          res.end(await response.text());
        })();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Prefixo vazio: carrega TODAS as variáveis do `.env.local`, inclusive as sem
  // `VITE_`. Isso só é seguro porque acontece aqui, no Node, e o valor nunca
  // entra na configuração que vai para o navegador.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      tailwindcss(),
      geminiProxyDev(env['GEMINI_API_KEY'] ?? process.env['GEMINI_API_KEY']),
    ],
    resolve: {
      // Resolve os aliases declarados em tsconfig.app.json (@/* -> ./src/*)
      tsconfigPaths: true,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.ts'],
      css: true,
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/**/*.{test,spec}.{ts,tsx}', 'src/main.tsx', 'src/**/*.d.ts'],
      },
    },
  };
});
