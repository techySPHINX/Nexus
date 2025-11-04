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
            if (id.includes('node_modules')) {
              if (id.includes('react')) return 'vendor-react';
              if (id.includes('axios')) return 'vendor-axios';
              if (id.includes('chart.js') || id.includes('recharts'))
                return 'vendor-charts';
              return 'vendor';
            }
            // Split only your **feature code**
            if (id.toLowerCase().includes('admin')) return 'admin-features';
            if (id.toLowerCase().includes('auth')) return 'auth-features';
            if (id.toLowerCase().includes('profile')) return 'profile-features';
            if (id.toLowerCase().includes('post')) return 'post-features';
            if (id.toLowerCase().includes('messaging'))
              return 'messaging-features';
            if (
              id.toLowerCase().includes('showcase') ||
              id.toLowerCase().includes('project')
            )
              return 'showcase-features';
            if (id.toLowerCase().includes('startup')) return 'startup-features';
            if (id.toLowerCase().includes('dashboard'))
              return 'dashboard-features';
            if (id.toLowerCase().includes('home')) return 'home-features';
            if (id.toLowerCase().includes('components'))
              return 'shared-components';
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
