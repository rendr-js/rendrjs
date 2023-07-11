import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/__tests__/**'],
    exclude: ['src/__tests__/utils.ts'],
    coverage: {
      lines: 100,
      functions: 100,
      branches: 100,
      statements: 100,
    },
  },
});
