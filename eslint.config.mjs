import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Exclude build artifacts, generated assets, test reports, and non-app maintenance scripts
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/sw.js",
    "public/workbox-*.js",
    "scripts/**",
    "prisma/seed.js",
    "tests/reports/**",
  ]),
  {
    rules: {
      // Demote no-explicit-any to warning (standard @typescript-eslint/recommended severity)
      // to keep any usages actively tracked without blocking compilation.
      "@typescript-eslint/no-explicit-any": "warn",

      // Demote React 19 experimental compiler check to warning
      // to accommodate mount-time data-fetching patterns across existing client components.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    files: ["tests/**"],
    rules: {
      // Test suites utilize flexible mock signatures and fixture types
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);

export default eslintConfig;
