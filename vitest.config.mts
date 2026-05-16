import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

const NODE_ENV_TESTS = ['src/lib/__tests__/auth.test.ts']

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'jsdom',
          environment: 'jsdom',
          include: ['**/*.{test,spec}.{ts,tsx}'],
          exclude: [...NODE_ENV_TESTS, 'node_modules/**', '.next/**'],
        },
      },
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: NODE_ENV_TESTS,
        },
      },
    ],
  },
})
