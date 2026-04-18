import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import tailwindcss from '@tailwindcss/vite'
import svgLoader from 'vite-svg-loader'

export const commonConfig = (({ mode }) => ({
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
    tailwindcss()
  ],
  build: {
    reportCompressedSize: false,
    chunkSizeWarningLimit: 2000,
  },
  define: {
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
  }
}));