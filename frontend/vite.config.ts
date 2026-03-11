import { defineConfig, loadEnv, type ConfigEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }: ConfigEnv) => {
  // Load all .env variables
  const env = loadEnv(mode, process.cwd(), '');
  const isAnalyze = mode === 'analyze';
  const CI_CHUNK_BUDGET_KB = 800;

  return {
    preview: {
      port: 4173,
      open: true,
      strictPort: true,
      host: true,
    },
    base: '/', // <--- ✅ Add this line
    plugins: [
      react({
        jsxImportSource: 'react',
      }),
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
      sourcemap: mode === 'development' || mode === 'analyze',
      minify: 'terser',
      // Use a modern target so esbuild / Vite can emit top-level await
      target: 'es2017',
      // Ensure esbuild also targets the same environment
      esbuild: {
        target: 'es2017',
      },
      // Soft budget warning in local builds; hard budget is enforced by scripts/check-bundle-budget.mjs in CI.
      chunkSizeWarningLimit: CI_CHUNK_BUDGET_KB,
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: true,
        },
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            // const lower = id.toLowerCase();

            // --- 1. Split vendor chunks strategically ---
            if (id.includes('node_modules')) {
              // Heavy dependencies that load separately
              if (id.includes('tiptap') || id.includes('prosemirror'))
                return 'vendor-editor';
              if (id.includes('firebase')) return 'vendor-firebase';
              if (id.includes('socket.io')) return 'vendor-socket';
              if (id.includes('lucide-react')) return 'vendor-lucide';
              if (id.includes('jwt-decode')) return 'vendor-auth-utils';
              if (id.includes('dayjs')) return 'vendor-dayjs';
              if (id.includes('dexie')) return 'vendor-storage';
              if (id.includes('zustand')) return 'vendor-state';
              if (id.includes('recharts')) return 'vendor-recharts';

              if (id.includes('@mui')) return 'vendor-mui';
              if (id.includes('@emotion')) return 'vendor-emotion';
              if (id.includes('@radix-ui')) return 'vendor-radix';
              if (id.includes('motion-dom')) return 'vendor-motion-dom';
              if (id.includes('framer-motion')) return 'vendor-motion';
              if (id.includes('@floating-ui')) return 'vendor-floating';
              if (id.includes('date-fns')) return 'vendor-date';
              if (id.includes('axios')) return 'vendor-axios';

              // Core UI dependencies - keep together
              return 'vendor-misc';
            }

            // --- 2. Feature chunks ---
            // if (lower.includes('dashboard')) return 'dashboard-features';
            // if (lower.includes('gamification')) return 'gamification-features';
            // if (lower.includes('admin')) return 'admin-features';
            // if (lower.includes('auth')) return 'auth-features';
            // if (lower.includes('profile')) return 'profile-features';
            // if (lower.includes('posts') || lower.includes('post'))
            //   return 'post-features';
            // if (lower.includes('subcommunity') || lower.includes('community'))
            //   return 'subcommunity-features';
            // if (lower.includes('messaging')) return 'messaging-features';
            // if (lower.includes('startup')) return 'startup-features';
            // if (lower.includes('showcase') || lower.includes('project'))
            //   return 'showcase-features';
            // if (lower.includes('events')) return 'events-features';
            // if (lower.includes('landing')) return 'landing-features';

            // --- 3. Shared ---
            // if (lower.includes('components')) return 'shared-components';

            return undefined;
          },
          chunkFileNames: `assets/[name]-[hash].js`,
          assetFileNames: `assets/[name]-[hash].[ext]`,
          entryFileNames: `assets/[name]-[hash].js`,
        },
        input: {
          main: '/index.html',
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
        'react',
        'react-dom',
        '@mui/material',
        '@mui/material/styles',
        '@emotion/react',
        '@emotion/styled',
        '@mui/styled-engine',
        '@floating-ui/react',
        '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-tooltip',
      ],
    },
  };
});
