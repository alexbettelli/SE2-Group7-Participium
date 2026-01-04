import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: './tests/setup.mjs',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'telegramBot/**',
      ],
    },
    include: ['tests/**/*.test.js','tests/**/*.test.mjs'],
    env: {
      UPLOADS_DIR: 'tests/test_uploads'
    }
  },
});
