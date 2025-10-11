import { defineConfig, type ConfigEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }: ConfigEnv) => {
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
      sourcemap: mode === 'development',
      minify: 'terser',
      target: 'es2015',
      chunkSizeWarningLimit: 1000,
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: true,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: (id: string): string | undefined => {
            if (typeof id !== 'string') return;

            // Vendor chunks
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom'))
                return 'vendor-react';
              if (id.includes('@mui/material')) return 'vendor-mui-core';
              if (id.includes('@mui/icons-material')) return 'vendor-mui-icons';
              if (id.includes('@emotion')) return 'vendor-emotion';
              if (id.includes('framer-motion')) return 'vendor-animation';
              if (id.includes('axios')) return 'vendor-http';
              if (id.includes('date-fns')) return 'vendor-date';
              if (id.includes('react-router')) return 'vendor-router';
              return 'vendor-other';
            }

            // Feature chunks (case-insensitive)
            const lowerId = id.toLowerCase();
            if (lowerId.includes('/admin/') || lowerId.includes('admin'))
              return 'admin-features';
            if (lowerId.includes('/auth/') || lowerId.includes('auth'))
              return 'auth-features';
            if (
              lowerId.includes('/messaging/') ||
              lowerId.includes('messaging')
            )
              return 'messaging-features';
            if (lowerId.includes('/profile/') || lowerId.includes('profile'))
              return 'profile-features';
            if (lowerId.includes('/post/') || lowerId.includes('post'))
              return 'post-features';

            return undefined;
          },

          chunkFileNames: `js/[name]-[hash].js`,

          assetFileNames: (assetInfo) => {
            const name = assetInfo.name ?? '';
            const ext = name.split('.').pop() ?? '';

            if (ext === 'css') return `css/[name]-[hash].${ext}`;
            if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(name)) {
              return `images/[name]-[hash].${ext}`;
            }
            return `assets/[name]-[hash].${ext}`;
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
