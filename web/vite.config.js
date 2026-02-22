import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Injects a unique build hash into sw.js so each deploy creates a new cache.
// Browsers detect the sw.js byte change → trigger install → activate cleans old caches.
function swBuildHash() {
  return {
    name: 'sw-build-hash',
    apply: 'build',
    closeBundle() {
      const swPath = resolve(__dirname, 'dist', 'sw.js')
      try {
        let content = readFileSync(swPath, 'utf-8')
        const hash = Date.now().toString(36)
        content = content.replace('__BUILD_HASH__', hash)
        writeFileSync(swPath, content)
        console.log(`[sw-build-hash] Injected build hash: ${hash}`)
      } catch {
        // sw.js not in dist, skip
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), swBuildHash()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-icons': ['lucide-react'],
          'vendor-util': ['dompurify'],
          'vendor-katex': ['katex'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        cookieDomainRewrite: 'localhost',
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    css: false,
  },
})
