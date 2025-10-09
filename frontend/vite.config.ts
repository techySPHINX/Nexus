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
      host: true, // expose to LAN for mobile testing
      port: 3001,
      cors: true,
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
            if (id.indexOf('node_modules') !== -1) {
              // Group vendors into logical chunks
              if (id.indexOf('@mui') !== -1) return 'vendor-mui';
              if (id.indexOf('react') !== -1) return 'vendor-react';
              if (id.indexOf('axios') !== -1 || id.indexOf('date-fns') !== -1)
                return 'vendor-utils';
              return 'vendor-other';
            }

            // Group by feature
            if (
              id.indexOf('/Admin/') !== -1 ||
              id.indexOf('Moderation') !== -1
            ) {
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
