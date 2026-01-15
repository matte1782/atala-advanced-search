import { defineConfig } from 'vite';
import { resolve } from 'path';
import compression from 'vite-plugin-compression';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@core': resolve(__dirname, './src/core'),
      '@effects': resolve(__dirname, './src/effects'),
      '@data': resolve(__dirname, './src/data'),
      '@ui': resolve(__dirname, './src/ui'),
      '@performance': resolve(__dirname, './src/performance'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'terser',
    target: 'es2022',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log'],
      },
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/main.ts'),
      },
      output: {
        entryFileNames: 'atala-advanced-search.min.js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        manualChunks: {
          'three': ['three'],
        },
      },
    },
    chunkSizeWarningLimit: 200, // KB - warn if chunks exceed 200KB
  },
  plugins: [
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240, // Only compress files > 10KB
    }),
  ],
  server: {
    port: 3000,
    open: false,
  },
});
