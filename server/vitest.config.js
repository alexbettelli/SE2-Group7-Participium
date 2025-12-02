import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: './tests/setup.mjs',
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    include: ['tests/**/*.test.js','tests/**/*.test.mjs'],
  },
});
