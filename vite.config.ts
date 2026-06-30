import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, 'examples'),
  // Covers the production build; the optimizeDeps.rolldownOptions define below
  // covers the dev pre-bundler (the top-level define does not reach
  // pre-bundled deps). Both are needed so react-grid-layout's
  // process.env.DRAGGABLE_DEBUG never reaches the browser.
  define: { 'process.env.DRAGGABLE_DEBUG': 'false' },
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    // prop-types and react-is are CJS; pre-bundle them so the optimizer adds
    // the ESM-interop default export that @mui's responsivePropType.mjs
    // imports, otherwise the browser throws "does not provide an export named
    // 'default'".
    include: ['prop-types', 'react-is', 'react-grid-layout/legacy'],
    rolldownOptions: {
      transform: {
        // react-grid-layout (via react-draggable) gates a debug log on
        // process.env.DRAGGABLE_DEBUG, which throws "process is not defined"
        // in the browser. Replace it during dep pre-bundling so `process` is
        // never dereferenced.
        define: { 'process.env.DRAGGABLE_DEBUG': 'false' },
      },
    },
  },
})
