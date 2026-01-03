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
];

export default config;
