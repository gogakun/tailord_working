import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        customElement: false
      }
    }),
    dts({
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: 'src/main.ts',
      name: 'RGGuide',
      fileName: 'widget',
      formats: ['es', 'umd']
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {}
      }
    },
    target: 'es2015',
    minify: 'terser',
    sourcemap: true,
    outDir: 'dist'
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  },
  server: {
    port: 5173,
    cors: true
  }
});
