import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const source = (packageName: string): string =>
  fileURLToPath(new URL(`./packages/${packageName}/src/index.ts`, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@infinity-11/ai-gateway': source('ai-gateway'),
      '@infinity-11/config': source('config'),
      '@infinity-11/events': source('events'),
      '@infinity-11/identity': source('identity'),
      '@infinity-11/observability': source('observability'),
      '@infinity-11/persistence': source('persistence'),
      '@infinity-11/security': source('security'),
      '@infinity-11/storage': source('storage'),
      '@infinity-11/types': source('types'),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    passWithNoTests: false,
  },
});
