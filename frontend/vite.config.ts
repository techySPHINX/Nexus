import { defineConfig, loadEnv, type ConfigEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }: ConfigEnv) => {
  // Load all .env variables
  const env = loadEnv(mode, process.cwd(), '');
  console.log('Vite env variables:', env.VITE_BACKEND_URL);

  const isAnalyze = mode === 'analyze';

  return {
    preview: {
      port: 4173,
      open: true,
      strictPort: true,
      host: true,
    },
    base: '/', // <--- ✅ Add this line
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
          target: env.VITE_BACKEND_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
      minify: 'terser',
      // Use a modern target so esbuild / Vite can emit top-level await
      target: 'es2017',
      // Ensure esbuild also targets the same environment
      esbuild: {
        target: 'es2017',
      },
      chunkSizeWarningLimit: 1000,
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: true,
        },
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            const lower = id.toLowerCase();

            // --- 1. Core vendor chunks ---
            if (id.includes('node_modules')) {
              // React must load first
              // if (id.includes('react') || id.includes('react-dom'))
              //   return 'first-vendor-react';

              // // MUI + Emotion must come AFTER React
              if (id.includes('@mui') || id.includes('@emotion'))
                return 'vendor-mui';

              // // Floating UI separately
              if (id.includes('@floating-ui')) return 'vendor-floating';

              if (id.includes('axios')) return 'vendor-axios';
              if (id.includes('chart.js') || id.includes('recharts'))
                return 'vendor-charts';

              return 'nodes_modules'; // default vendor chunk
            }

            // --- 2. Feature chunks ---
            if (lower.includes('dashboard')) return 'dashboard-features';
            if (lower.includes('gamification')) return 'gamification-features';
            if (lower.includes('admin')) return 'admin-features';
            if (lower.includes('auth')) return 'auth-features';
            if (lower.includes('profile')) return 'profile-features';
            if (lower.includes('posts')) return 'post-features';
            if (lower.includes('messaging')) return 'messaging-features';
            if (lower.includes('startup')) return 'startup-features';
            if (lower.includes('showcase') || lower.includes('project'))
              return 'showcase-features';
            if (lower.includes('events')) return 'events-features';

            // --- 3. Shared ---
            if (lower.includes('components')) return 'shared-components';

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
    optimizeDeps: {
      include: [
        '@mui/material',
        '@mui/material/styles',
        '@emotion/react',
        '@emotion/styled',
        '@mui/styled-engine',
      ],
    },
  };
});
