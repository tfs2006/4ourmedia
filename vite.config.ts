import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (id.includes('lucide-react')) {
            return 'ui-icons';
          }

          if (id.includes('@supabase/supabase-js')) {
            return 'supabase';
          }

          if (
            id.includes('/react/') ||
            id.includes('react-dom') ||
            id.includes('scheduler')
          ) {
            return 'react-vendor';
          }

          return 'vendor';
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
