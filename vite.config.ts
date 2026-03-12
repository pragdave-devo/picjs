import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/jspic.ts'),
      name: 'jspic',
      fileName: (format) => format === 'umd' ? 'jspic.umd.js' : 'jspic.js',
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      output: {
        exports: 'named',
      },
    },
    sourcemap: true,
  },
});
