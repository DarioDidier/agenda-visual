import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          }
        }
      }
    }
  };
});