// eslint.config.js
import globals from "globals";
import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';
// You might also need eslintPluginReactHooks if you use it, e.g.:
// import eslintPluginReactHooks from 'eslint-plugin-react-hooks';

export default [
  {
    // Global ignores
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/out/**",
      "**/build/**",
      "src/generated/prisma/client.js",
      "src/generated/prisma/index.d.ts",
      // Add any other generated files or directories you want to ignore
    ],
  },
  
  // Base configurations (applies to all files not ignored)
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    // If you use React Hooks plugin
    // plugins: {
    //   'react-hooks': eslintPluginReactHooks,
    // },
    // rules: {
    //   ...eslintPluginReactHooks.configs.recommended.rules,
    // }
  },

  // TypeScript specific configurations
  ...tseslint.configs.recommended, // Or tseslint.configs.strict for stricter rules

  // Next.js specific configurations
  {
    files: ["**/*.{js,jsx,ts,tsx}"], // Apply Next.js rules to these files
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      // You can override or add more Next.js specific rules here
      // For example, to ensure 'Image' component is used correctly:
      // "@next/next/no-img-element": "warn", 
    },
    settings: {
      react: {
        version: "detect", // Automatically detect the React version
      },
    },
  },

  // Your project-specific rules or overrides
  // This should ideally come after extending recommended configs
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"], // Or more specific like ["src/**/*.{ts,tsx}"]
    rules: {
      // Example:
      // "@typescript-eslint/no-explicit-any": "warn",
      // "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      // Add any other project-specific rules here
    },
  }
];
