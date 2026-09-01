import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
    globals: true,
    server: {
      deps: {
        inline: ['@print/ui', '@base-ui-components/react'],
      },
    },
  },
  optimizeDeps: {
    exclude: ['@print/ui'],
  },
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
      react: path.resolve(rootDir, 'node_modules/react'),
      'react-dom': path.resolve(rootDir, 'node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(rootDir, 'node_modules/react/jsx-runtime'),
      'react/jsx-dev-runtime': path.resolve(
        rootDir,
        'node_modules/react/jsx-dev-runtime',
      ),
      '@base-ui-components/react': path.resolve(
        rootDir,
        'node_modules/@base-ui-components/react',
      ),
      '@base-ui-components/utils': path.resolve(
        rootDir,
        'node_modules/@base-ui-components/utils',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  css: {
    preprocessorOptions: {
      scss: {
        loadPaths: [
          path.resolve(rootDir, 'node_modules/@print/ui/dist'),
          path.resolve(rootDir, 'node_modules/@print/ui/src'),
        ],
      },
    },
  },
  server: {
    port: 5186,
    strictPort: false,
  },
})
