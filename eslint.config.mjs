// eslint.config.js  (flat config, ESLint v9+)
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import unused from 'eslint-plugin-unused-imports';
// …

export default [
  /* 1️⃣  Ignore junk we never want to lint */
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/out/**',
      '**/build/**',
      'src/generated/prisma/**',
      'coverage/**',
      'cypress/**',
      '**dist/**',
    ],
  },

  /* 2️⃣  Enable TypeScript parsing + base rules */
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { sourceType: 'module', project: true }, // if you have tsconfig.json
    },
    plugins: { '@typescript-eslint': tsPlugin },

    //  ---- rules we’re dialling down for now ----
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { args: 'after-used', ignoreRestSiblings: true }],
    },
  },
{
  plugins: { 'unused-imports': unused },
  rules: {
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'error',
      { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
    ],
  },
},
{
  files: ['env.d.ts', 'src/lib/prisma.ts', 'src/lib/work.ts'],
  rules: { '@typescript-eslint/no-explicit-any': 'off' },
},


  /* 3️⃣  (Optional) Next.js rules – uncomment if you want them */
  // {
  //   plugins: { '@next/next': (await import('@next/eslint-plugin-next')).default },
  //   rules: {
  //     ...((await import('@next/eslint-plugin-next')).configs.recommended.rules),
  //     ...((await import('@next/eslint-plugin-next')).configs['core-web-vitals'].rules),
  //   },
  // },
];
