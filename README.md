# FinanceIA

Aplicação de finanças com IA. React 19 + TypeScript + Vite + Tailwind CSS v4.

## Requisitos

- Node.js >= 20.19
- npm

## Começando

```bash
npm install   # instala deps e configura os hooks do Husky (script `prepare`)
npm run dev
```

## Scripts

| Script                  | Descrição                                                      |
| ----------------------- | -------------------------------------------------------------- |
| `npm run dev`           | Servidor de desenvolvimento                                    |
| `npm run build`         | Typecheck + build de produção                                  |
| `npm run preview`       | Serve o build de produção localmente                           |
| `npm run typecheck`     | Checagem de tipos sem emitir                                   |
| `npm run lint`          | ESLint (falha com qualquer warning)                            |
| `npm run lint:fix`      | ESLint com correção automática                                 |
| `npm run format`        | Formata tudo com Prettier                                      |
| `npm run format:check`  | Verifica formatação sem alterar arquivos                       |
| `npm test`              | Testes (Vitest, execução única)                                |
| `npm run test:watch`    | Testes em watch mode                                           |
| `npm run test:coverage` | Testes com relatório de cobertura                              |
| `npm run validate`      | typecheck + lint + format:check + test (use antes de abrir PR) |

## Convenções

### TypeScript

Modo `strict` habilitado, com verificações adicionais: `noUncheckedIndexedAccess`,
`noImplicitReturns`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`,
`noUnusedLocals` e `noUnusedParameters`.

**`any` é proibido.** As regras `no-explicit-any` e a família `no-unsafe-*` do
typescript-eslint são erros. Quando o tipo for realmente desconhecido, use `unknown`
e faça o narrowing. `!` (non-null assertion) também é erro — verifique explicitamente
(veja `src/main.tsx`).

### Imports

- Alias `@/` aponta para `src/` (ex.: `import App from '@/App'`).
- Ordenação e agrupamento são automáticos via `eslint-plugin-simple-import-sort`
  (`npm run lint:fix` organiza).
- Imports não utilizados são removidos automaticamente.
- Imports de tipo usam a forma inline: `import { type Foo, bar } from './x'`.

### Estilos

Tailwind CSS v4 com configuração CSS-first. Os design tokens ficam no bloco `@theme`
de `src/index.css` — não existe `tailwind.config.js`. As classes são ordenadas
automaticamente pelo `prettier-plugin-tailwindcss`.

### Testes

Vitest + Testing Library, ambiente jsdom. Arquivos `*.test.tsx` / `*.test.ts` ficam
ao lado do código que testam. Matchers do `jest-dom` já estão registrados globalmente.

### Commits

Seguem [Conventional Commits](https://www.conventionalcommits.org/), validados pelo
commitlint no hook `commit-msg`:

```
<tipo>(<escopo opcional>): <descrição em minúsculas>

feat(dashboard): adiciona resumo de gastos mensais
fix(api): corrige parsing de valores negativos
```

Tipos aceitos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`,
`ci`, `chore`, `revert`.

### Hooks de Git (Husky)

- `pre-commit` → `lint-staged` (ESLint `--fix` + Prettier apenas nos arquivos staged)
- `commit-msg` → `commitlint`

Se precisar pular um hook em caso excepcional: `git commit --no-verify`.

## Editor

O projeto inclui `.vscode/settings.json` (format-on-save + ESLint fix ao salvar) e
`.vscode/extensions.json` com as extensões recomendadas — aceite o prompt do VS Code
ao abrir o projeto pela primeira vez.
