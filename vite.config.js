import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carga las variables de entorno para que estén disponibles durante el build/dev
  // El tercer argumento '' permite cargar todas las variables, no solo las que empiezan con VITE_
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Esto reemplaza `process.env.API_KEY` en tu código con el valor real de la variable de entorno
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    },
    build: {
      outDir: 'dist',
    }
  };
});