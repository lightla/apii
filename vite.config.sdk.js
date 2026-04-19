import {defineConfig} from 'vite'
import {commonConfig} from './vite.config.common.js';

export default defineConfig(({ mode }) => ({
  ...commonConfig({ mode }),
  build: {
    outDir: 'dist/sdk',
    lib: {
      entry: './src/sdk-entry.ts',
      name: 'Apii',
      fileName: 'apii',
      formats: ['iife'],
    },
    rollupOptions: {
      output: { 
        exports: 'named', 
        name: 'Apii', 
        inlineDynamicImports: true, 
        interop: 'auto',
        banner: `var process = process || { env: { NODE_ENV: "production" } };`
      },
    },
    target: 'es2020',
    minify: 'esbuild',
    emptyOutDir: true,
    sourcemap: false,
  }
}));
