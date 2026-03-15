import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    base: '/Monopoly-Deal/',
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './tests/setup.js',
      css: true,
      env: {
        ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY || '',
      },
    },
  }
})
