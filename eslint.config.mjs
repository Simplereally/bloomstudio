import coreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  {
    ignores: [
      "**/coverage/**",
      "**/.turbo/**",
      "**/dist/**",
      "**/build/**",
      "convex/_generated/**",
    ],
  },
  ...coreWebVitals,
  ...nextTypescript,
  // Override rules for test files
  {
    files: ["**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@next/next/no-img-element": "off",
      "jsx-a11y/alt-text": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
    },
  },
];

export default config;
