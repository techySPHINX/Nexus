import { defineConfig, type ConfigEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }: ConfigEnv) => {
  const isAnalyze = mode === 'analyze';

  return {
    preview: {
      port: 4173,
      open: true,
      strictPort: true,
      host: true,
    },
    base: './', // <--- ✅ Add this line
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
          manualChunks(id: string) {
            // Split only your **feature code**
            if (id.includes('/src/admin/')) return 'admin-features';
            if (id.includes('/src/auth/')) return 'auth-features';
            if (id.includes('/src/profile/')) return 'profile-features';
            if (id.includes('/src/post/')) return 'post-features';
            if (id.includes('/src/messaging/')) return 'messaging-features';
            if (id.includes('/src/showcase/')) return 'showcase-features';
            if (id.includes('/src/dashboard/')) return 'dashboard-features';
            if (id.includes('/src/settings/')) return 'settings-features';
            if (id.includes('/src/home/')) return 'home-features';
            if (id.includes('/src/components/')) return 'shared-components';
            // Let Vite handle all node_modules safely
            return undefined;
          },
          chunkFileNames: `assets/[name]-[hash].js`,
          assetFileNames: `assets/[name]-[hash].[ext]`,
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
