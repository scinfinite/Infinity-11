import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@infinity-11/ai-gateway': './packages/ai-gateway/src/index.ts',
      '@infinity-11/config': './packages/config/src/index.ts',
      '@infinity-11/events': './packages/events/src/index.ts',
      '@infinity-11/identity': './packages/identity/src/index.ts',
      '@infinity-11/observability': './packages/observability/src/index.ts',
      '@infinity-11/persistence': './packages/persistence/src/index.ts',
      '@infinity-11/security': './packages/security/src/index.ts',
      '@infinity-11/storage': './packages/storage/src/index.ts',
      '@infinity-11/types': './packages/types/src/index.ts',
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    passWithNoTests: false,
  },
});
