import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    base: '/', // Ensure relative paths for assets
    define: {
      // Safely inject the API key string. 
      // We use a custom variable name to avoid confusion with the global process object.
      '__APP_ENV_API_KEY__': JSON.stringify(env.API_KEY || ''),
    },
    build: {
      outDir: 'dist',
      sourcemap: true
    }
  }
})