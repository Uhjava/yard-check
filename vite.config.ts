import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    base: '/',
    server: {
      hmr: {
        overlay: false // Disable Vite's error overlay so we can use our custom one
      }
    },
    define: {
      // Safely replace ONLY specific keys. 
      // Do NOT try to redefine 'process' or 'process.env' object-wide as it breaks polyfills.
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    build: {
      outDir: 'dist',
      sourcemap: true
    }
  }
})