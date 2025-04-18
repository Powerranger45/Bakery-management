// eslint.config.js
export default {
    env: {
      browser: true,
      es2021: true,
      node: true,
    },
    extends: [
      'eslint:recommended',
      'plugin:react/recommended',
      'plugin:@typescript-eslint/recommended',
      'prettier', // Disable formatting rules that conflict with Prettier
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: ['react', '@typescript-eslint', 'prettier'],
    rules: {
      'prettier/prettier': 'error',
      'react/react-in-jsx-scope': 'off', // React 18+ doesn't require React import in JSX
      'react/prop-types': 'off', // Disable prop-types since we're using TypeScript
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-unused-vars': 'warn',
    },
    settings: {
      react: {
        version: 'detect', // Automatically detect the React version
      },
    },
  };
