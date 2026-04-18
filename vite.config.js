import {defineConfig} from 'vite';
import {commonConfig} from './vite.config.common.js';

export default defineConfig(({ mode }) => ({
  ...commonConfig({ mode }),
  build: {
    outDir: 'dist/app',
    emptyOutDir: false
  }
}));