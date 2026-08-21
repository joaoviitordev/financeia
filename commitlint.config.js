/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // nova funcionalidade
        'fix', // correção de bug
        'docs', // documentação
        'style', // formatação, sem mudança de código
        'refactor', // refatoração sem mudar comportamento
        'perf', // melhoria de performance
        'test', // testes
        'build', // build system / dependências
        'ci', // configuração de CI
        'chore', // tarefas de manutenção
        'revert', // reverter um commit
      ],
    ],
    'subject-case': [2, 'never', ['upper-case', 'pascal-case', 'start-case']],
    'body-max-line-length': [0, 'always'],
  },
};
