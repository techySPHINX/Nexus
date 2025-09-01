import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isAnalyze = mode === 'analyze';

  return {
    plugins: [
      react(),
      isAnalyze &&
        visualizer({
          filename: 'dist/stats.html',
          open: true,
          gzipSize: true,
          brotliSize: true,
        }),
    ].filter(Boolean),
    server: {
      port: 3001,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              // Group vendors into logical chunks
              if (id.includes('@mui')) return 'vendor-mui';
              if (id.includes('react')) return 'vendor-react';
              if (id.includes('axios') || id.includes('date-fns'))
                return 'vendor-utils';
              return 'vendor-other';
            }

            // Group by feature
            if (id.includes('/Admin/') || id.includes('Moderation')) {
              return 'moderation-features';
            }
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': '/src',
      },
    },
  };
});
