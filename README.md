# Finance IA

Aplicação de finanças com IA. React 19 + TypeScript + Vite + Tailwind CSS v4.

## Requisitos

- Node.js >= 20.19
- npm

## Começando

```bash
npm install   # instala deps e configura os hooks do Husky (script `prepare`)
npm run dev
```

Para o diagnóstico com IA e a conversa, copie `.env.example` para `.env.local` e
preencha `GEMINI_API_KEY` com uma chave do
[Google AI Studio](https://aistudio.google.com/). Sem a chave o aplicativo roda
normalmente: só o diagnóstico e a conversa não são gerados, e a tela de
resultado avisa que falta configurá-la.

### A chave fica no servidor

O nome não tem o prefixo `VITE_` de propósito. Esse prefixo é o mecanismo pelo
qual o Vite embute uma variável no pacote que o navegador baixa, e uma chave
embutida ali é lida por qualquer pessoa que abra as ferramentas de
desenvolvedor.

O navegador nunca fala com o Google. Ele manda o texto para `/api/gemini`, no
próprio domínio, e quem guarda a chave é o proxy:

- em produção, `api/gemini.ts`, publicado pela Vercel;
- em desenvolvimento, um plugin do `vite.config.ts`.

Os dois são adaptadores de dez linhas em cima do mesmo módulo,
`src/server/gemini-proxy.ts`. Essa divisão é o que impede desenvolvimento e
produção de divergirem, e há um teste que falha se alguém escrever um segundo
proxy.

### Publicar na Vercel

1. Cadastre `GEMINI_API_KEY` em Settings > Environment Variables. Sem isso o
   site sobe e o diagnóstico avisa que falta a chave.
2. O `vercel.json` redireciona qualquer caminho que não seja `/api/` para o
   `index.html`. Sem esse redirecionamento, `/historico` e `/resultado/:id`
   devolvem 404: são rotas do React Router, existem só no navegador e não como
   arquivo. O 404 aparece ao abrir o link direto, ao recarregar a página e ao
   voltar pelo navegador, que são justamente os caminhos que a feature
   `historico` existe para servir.
3. A pasta `api/` é publicada sozinha, sem configuração.

**O que esta divisão ainda não resolve:** o endereço `/api/gemini` fica aberto a
quem souber dele, e a cota continua sendo a de quem publicou. Limitar por
origem, IP ou sessão é trabalho de outra etapa.

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
e faça o narrowing. `!` (non-null assertion) também é erro. Verifique explicitamente
(veja `src/main.tsx`).

### Imports

- Alias `@/` aponta para `src/` (ex.: `import App from '@/App'`).
- Ordenação e agrupamento são automáticos via `eslint-plugin-simple-import-sort`
  (`npm run lint:fix` organiza).
- Imports não utilizados são removidos automaticamente.
- Imports de tipo usam a forma inline: `import { type Foo, bar } from './x'`.

### Estilos

Tailwind CSS v4 com configuração CSS-first. Os design tokens ficam no bloco `@theme`
de `src/index.css`, e não existe `tailwind.config.js`. As classes são ordenadas
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

## Sistema de design

Fiel ao Human Interface Guidelines da Apple, com light e dark mode de primeira classe.
Direção: **Liquid Glass restrito à navegação** (sidebar, toolbar, tab bar, sheets); superfícies
de conteúdo e gráficos ficam opacas, porque translucidez atrás de dado financeiro denso torna o
contraste dependente do que passa por baixo.

Layout segue **macOS no desktop** (sidebar + toolbar) e **iOS no mobile** (tab bar + listas
agrupadas inset), a partir de um único conjunto de tokens.

### Tokens

Ficam em `src/styles/tokens/`, um arquivo por eixo: `color`, `typography`, `layout`, `motion`,
`material` e `chart`. `src/styles/base.css` traz reset, foco e utilitários.

**Como o tema troca.** O Tailwind v4 resolve `@theme` estaticamente, então um token declarado
lá é embutido como valor literal e não acompanha o tema. Por isso a cor vem em dois níveis: os
valores semânticos vivem em `:root` e nos escopos de tema, e o bloco `@theme inline` do
`src/index.css` faz o utilitário emitir `var(--…)` em vez do valor resolvido.

Na prática: **escreva componentes contra papéis** (`bg-surface`, `text-label-secondary`,
`text-gain`) e praticamente nunca use a variante `dark:`.

O `ThemeProvider` grava sempre um `data-theme` concreto na raiz, nunca `"system"`, que vive
apenas no React e no `localStorage`. Um script inline bloqueante no `index.html` aplica o tema
antes da primeira pintura, evitando o flash branco.

### Tipografia

Text styles do iOS (largeTitle → caption2) com tamanho, entrelinha, peso e tracking juntos:
`text-body`, `text-headline`, `text-title-1`…

A SF Pro **não** é empacotada, porque a licença restringe o uso a desenvolvimento para plataformas
Apple. O stack de sistema entrega a SF Pro genuína em Mac, iPhone e iPad, e cai para Segoe UI
Variable no Windows.

### Ao acrescentar um text style

`src/lib/cn.ts` mantém a lista dos text styles para o `tailwind-merge`. Sem ela, ele não
distingue `text-body` (tamanho) de `text-label` (cor), joga os dois no mesmo grupo de conflito
e **descarta a cor em silêncio**. Foi assim que todo botão preenchido acabou com texto preto
sobre azul, sem erro nenhum no console.

Criou um text style novo em `tokens/typography.css`? Adicione o nome em `TEXT_STYLES` no
`cn.ts`. Há teste de regressão em `src/lib/cn.test.ts`.

### Cores de gráfico

`--chart-1` a `--chart-8`, em `src/styles/tokens/chart.css`. **As system colors da Apple
reprovam como paleta de gráfico**: `systemYellow` fica fora da faixa de luminosidade, verde↔rosa
medem ΔE 6.5 sob deuteranopia e quatro delas ficam abaixo de 3:1 no branco.

A paleta publicada preserva os ângulos de matiz OKLCH da Apple e re-passa luminosidade e chroma
para dentro da faixa exigida. A **ordem dos slots é o mecanismo de segurança para daltonismo,
não estética**: foi resolvida como caminho de gargalo máximo exigindo aprovação nos dois modos.

Verificado com o validador da skill `dataviz`: CVD adjacente ΔE 18.0 claro / 18.4 escuro
(alvo ≥8), visão normal 21.6 / 21.7 (piso ≥15), contraste ≥3:1 nas duas superfícies.

Regras: atribua os slots em ordem fixa, nunca cicle; a cor segue a entidade, nunca o ranking;
dispersão e bolha usam `--chart-scatter-*` e param em 3 séries; texto usa tokens de label,
nunca a cor da série.

Ao mexer na paleta, **rode o validador, não confie no olho**:

```bash
node <skill>/dataviz/scripts/validate_palette.js "<hexes>" --mode light --surface "#FFFFFF"
node <skill>/dataviz/scripts/validate_palette.js "<hexes>" --mode dark  --surface "#1C1C1E"
```

### Contraste: onde nos afastamos da Apple

A paleta de UI da Apple não atinge o WCAG AA para texto pequeno. Optamos por um híbrido:
fidelidade nos preenchimentos, AA no texto:

| Token                   | Apple              | Publicado          | Motivo        |
| ----------------------- | ------------------ | ------------------ | ------------- |
| `label-secondary` claro | alfa .60 (3.44:1)  | alfa .75 (4.82:1)  | AA para texto |
| `label-tertiary` claro  | alfa .30 (1.72:1)  | alfa .60 (3.29:1)  | AA para texto |
| `label-tertiary` escuro | alfa .30 (2.48:1)  | alfa .40 (3.25:1)  | AA para texto |
| `accent-text` claro     | `#007AFF` (4.02:1) | `#0068D9` (4.73:1) | AA para texto |

Inalterados por fidelidade: fundos, superfícies, cinzas, status, séries e o `--accent` de
preenchimento (`#007AFF` / `#0A84FF`).

**Débito conhecido:** branco sobre `--accent` em botão preenchido mede 4.02:1 (claro) e 3.65:1
(escuro), abaixo dos 4.5:1 de AA. Mantido porque branco sobre systemBlue é a assinatura visual
mais reconhecível da Apple e mudá-la seria o desvio mais visível do sistema. Revisite se
acessibilidade AA for exigida em auditoria.

### Movimento

As três molas do SwiftUI vêm de simulação física real, expressas com `linear()`:
`--spring-smooth`, `--spring-snappy` (padrão para controles), `--spring-bouncy`. Uma
`cubic-bezier` não serviria, porque é monotônica e não consegue ultrapassar 1, então perderia o
overshoot, que é justamente o que faz o movimento parecer da Apple.

`prefers-reduced-motion` é respeitado globalmente.

### Componentes

Em `src/components/ui/`: `Button`, `Card`, `ListGroup`/`ListRow`, `SegmentedControl`, `Switch`,
`Separator`, `Toolbar`/`Sidebar`/`TabBar`, `Sheet`, `StatTile`, `Sparkline`.

`Sheet` é a única com dependência externa (`@radix-ui/react-dialog`): focus trap, devolução de
foco e `aria-modal` são fáceis de errar à mão e falham silenciosamente.

`StatTile` codifica a direção três vezes: cor, seta e sinal. Não é redundância decorativa:
daltonismo vermelho-verde é exatamente o eixo de ganho e perda, então o sinal precisa sobreviver
sem a cor.

A rota `/` é uma vitrine do sistema nos dois temas. Use `npm run dev` para percorrê-la.

## Editor

O projeto inclui `.vscode/settings.json` (format-on-save + ESLint fix ao salvar) e
`.vscode/extensions.json` com as extensões recomendadas. Aceite o prompt do VS Code
ao abrir o projeto pela primeira vez.
