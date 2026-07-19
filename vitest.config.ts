import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['e2e/**', 'node_modules/**'],
    coverage: {
      include: ['src/utils/**/*.ts'],
      reporter: ['text', 'html'],
    },
  },
});
