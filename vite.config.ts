import { defineConfig } from 'vite';
import path from 'path'
export default defineConfig(({ command, mode }) => {
  return {
    base: './',
    build: {
      outDir: './docs',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '../src'),
        '#': path.resolve(__dirname, '../types'),
      },
    },
  };
});
