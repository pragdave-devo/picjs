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
  server: {
    fs: {
      allow: ['..'],
    },
  },
  plugins: [
    {
      name: 'rewrite-assets-to-dist',
      configureServer(server) {
        // In dev, rewrite /assets/ requests to /dist/ so paths work like production
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith('/assets/')) {
            req.url = req.url.replace('/assets/', '/dist/');
          }
          next();
        });
      },
    },
  ],
});
