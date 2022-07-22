import { defineConfig } from 'vite';
import path from 'path'
import vue from '@vitejs/plugin-vue'
export default defineConfig(({ command, mode }) => {
  return {
    base: './',
    build: {
      outDir: './docs',
    },
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '../src'),
        '#': path.resolve(__dirname, '../types'),
      },
    },
  };
});
