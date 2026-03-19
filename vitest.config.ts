import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Vitest configuration for GrünBilanz unit tests.
 * Uses Node environment for pure unit testing of lib/ utilities.
 * Mocks Prisma to avoid requiring a live database during testing.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    include: ['src/__tests__/**/*.test.ts', 'src/__tests__/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/**/*.ts', 'src/lib/**/*.tsx'],
      exclude: ['src/lib/pdf/**'], // PDF components are harder to unit test
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
