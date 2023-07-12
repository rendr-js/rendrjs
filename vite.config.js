import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/__tests__/*.ts'],
    exclude: [
      'src/__tests__/utils.ts',
      'src/__tests__/*.bench.ts',
    ],
    coverage: {
      lines: 100,
      functions: 100,
      branches: 100,
      statements: 100,
    },
    benchmark: {
      include: ['src/__tests__/*.bench.ts'],
      exclude: [
        'src/__tests__/utils.ts',
      ],
    },
  },
});
