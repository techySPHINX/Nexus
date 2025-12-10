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
      sourcemap: mode === 'development',
      minify: 'terser',
      // Use a modern target so esbuild / Vite can emit top-level await
      target: 'es2017',
      // Ensure esbuild also targets the same environment
      esbuild: {
        target: 'es2017',
      },
      chunkSizeWarningLimit: 1200,
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

            // --- 1. Split vendor chunks strategically ---
            if (id.includes('node_modules')) {
              // Heavy dependencies that load separately
              if (id.includes('three')) return 'vendor-three';
              if (id.includes('tiptap') || id.includes('prosemirror'))
                return 'vendor-editor';
              if (id.includes('firebase')) return 'vendor-firebase';
              if (id.includes('socket.io')) return 'vendor-socket';

              // Core UI dependencies - keep together
              return 'vendor-core';
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
