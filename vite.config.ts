import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Fix: Cast process to any to avoid type error 'Property cwd does not exist on type Process'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Prioridad de variables de entorno (Local .env o Servidor)
  // Vite prefiere VITE_*, pero mantenemos la compatibilidad
  const apiKey = env.VITE_API_KEY || env.API_KEY || process.env.API_KEY || '';

  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey)
    },
    build: {
      outDir: 'dist',
      chunkSizeWarningLimit: 1000, // Aumentar límite a 1MB para evitar warnings
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Separar dependencias de node_modules en un chunk 'vendor'
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          }
        }
      }
    }
  };
});