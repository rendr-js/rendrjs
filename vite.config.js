import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'jsdom',
  },
  define: { __DEV__: true },
});
