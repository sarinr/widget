import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'coverage/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/tests/**',
        'codegen/**',
        '.github/**',
        'packages/*/dist/**',
        'packages/*/tsup.config.ts'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      },
      include: [
        'packages/*/src/**/*.ts'
      ]
    },
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      'node_modules',
      'dist',
      '.turbo',
      'coverage',
      '.github',
      'codegen/dist'
    ],
    setupFiles: ['./tests/setup.ts']
  },
  resolve: {
    alias: {
      '@monorepo/widget': path.resolve(__dirname, './packages/widget/src'),
      '@monorepo/widget-types': path.resolve(__dirname, './packages/widget-types/src')
    }
  }
});
