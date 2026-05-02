import { defineConfig } from 'vite';
import { resolve } from 'path';

const target = process.env.BUILD_TARGET || 'main'

const configs: Record<string, any> = {
  main: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'picjs',
      fileName: (format: string) => format === 'umd' ? 'picjs.umd.js' : 'picjs.js',
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      output: {
        exports: 'named',
        inlineDynamicImports: true,
      },
    },
  },
  runtime: {
    lib: {
      entry: resolve(__dirname, 'src/runtime.ts'),
      name: 'picjsRuntime',
      fileName: (format: string) => format === 'umd' ? 'picjs.runtime.umd.js' : 'runtime.js',
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      output: {
        exports: 'named',
        inlineDynamicImports: true,
      },
    },
  },
  playground: {
    lib: {
      entry: resolve(__dirname, 'src/jp-web.ts'),
      name: 'picjsPlayground',
      fileName: () => 'playground.js',
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
}

export default defineConfig({
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: target === 'main',
    ...configs[target],
    minify: 'esbuild',
    sourcemap: false,
  },
  optimizeDeps: {
    exclude: ['_site'],
    entries: ['index.html'],
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
