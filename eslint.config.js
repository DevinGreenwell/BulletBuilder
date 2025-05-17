// eslint.config.js
// Make sure to import any other plugins or configurations you are using.
// For example, if you use @typescript-eslint:
// import tseslint from 'typescript-eslint';
// import nextPlugin from '@next/eslint-plugin-next'; // If using Next.js specific rules

export default [
  // Your other ESLint configurations (e.g., for TypeScript, React, Next.js) would go here.
  // For example:
  // ...tseslint.configs.recommended,
  // {
  //   plugins: {
  //     '@next/next': nextPlugin,
  //   },
  //   rules: {
  //     ...nextPlugin.configs.recommended.rules,
  //     ...nextPlugin.configs['core-web-vitals'].rules,
  //   },
  // },

  // Add this section to ignore specific files and directories
  {
    ignores: [
      "**/node_modules/**", // Standard practice to ignore node_modules
      "**/.next/**",       // Standard practice for Next.js projects
      "**/out/**",         // Standard practice for Next.js static exports
      "**/build/**",       // Common build output directory
      "src/generated/prisma/client.js",    // Ignore the generated Prisma client JS file
      "src/generated/prisma/index.d.ts", // Ignore the generated Prisma type definitions
      // Add any other generated files or directories you want to ignore
    ],
  },

  // Example of how you might configure rules for the rest of your project
  // This is just illustrative; your actual configuration will vary.
  // {
  //   files: ["**/*.{js,mjs,cjs,ts,tsx}"],
  //   rules: {
  //     // Your project-specific rules
  //     "@typescript-eslint/no-explicit-any": "warn", // Example: warn on 'any'
  //   },
  // }
];
