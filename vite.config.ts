import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'docs',
  build: {
    lib: {
      entry: resolve(__dirname, 'src/picjs.ts'),
      name: 'picjs',
      fileName: (format) => format === 'umd' ? 'picjs.umd.js' : 'picjs.js',
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      output: {
        exports: 'named',
      },
    },
    minify: 'esbuild',
    sourcemap: true,
  },
});
