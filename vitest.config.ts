import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      enabled: true,
      reportOnFailure: true,
      reporter: ['text', 'html', 'json-summary', 'json'],
      thresholds: {
        lines: 100,
        branches: 100,
        functions: 100,
        statements: 100,
      },
      exclude: [
        // Not code
        'scripts/**',
        'src/generated/**',
        'example/**',
        'dist/**',
        '*.config.*',

        // Not part of library
        'src/index.ts',

        // TODO
        'src/express.ts',
      ],
    },
    include: ['src/**/*.test.ts'],
  },
});
