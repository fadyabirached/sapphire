const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  { ignores: ['node_modules', 'uploads'] },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: globals.node,
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { args: 'none' }],
    },
  },
];
