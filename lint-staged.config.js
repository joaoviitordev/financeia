/** @type {import('lint-staged').Configuration} */
export default {
  '*.{ts,tsx}': ['eslint --fix --max-warnings=0', 'prettier --write'],
  '*.{js,jsx,mjs,cjs}': ['eslint --fix --max-warnings=0', 'prettier --write'],
  '*.{json,css,md,yml,yaml,html}': ['prettier --write'],
};
