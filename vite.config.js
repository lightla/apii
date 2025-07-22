import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import tailwindcss from '@tailwindcss/vite'
import svgLoader from 'vite-svg-loader'

export default defineConfig(({ mode }) => ({
  // Dùng mode động (development cho npm run dev)
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        additionalData: `@use "sass:math";`,
      },
    },
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => false,
        },
      },
    }),
    svgLoader(),
    NodeGlobalsPolyfillPlugin({
      process: true,
      buffer: true,
      define: { 'process.env.NODE_ENV': JSON.stringify(mode) },
    }),
    tailwindcss()
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
    'process.env': '{}',
    'process': '{}',
    '__VUE_PROD_DEVTOOLS__': 'false',
    '__VUE_PROD_HYDRATION_MISMATCH_DETAILS__': 'false',
    '__VUE_OPTIONS_API__': 'true',
    'global': 'globalThis',
  },
  optimizeDeps: {
    esbuildOptions: {
      define: { global: 'globalThis' },
      plugins: [NodeGlobalsPolyfillPlugin({ process: true, buffer: true })],
    },
  },
  build: {
    lib: {
      entry: './src/sdk-entry.ts',
      name: 'Apii',
      fileName: 'apii',
      formats: ['iife'],
    },
    rollupOptions: {
      output: { exports: 'default', name: 'Apii', inlineDynamicImports: true, interop: 'auto' },
    },
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      format: { comments: false },
      compress: { drop_console: true, pure_funcs: ['console.info', 'console.debug'] },
    },
    emptyOutDir: true,
    sourcemap: false,
  },
}));