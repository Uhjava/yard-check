import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    base: './', // Ensures relative paths for assets (critical for Netlify)
    define: {
      // 1. Prevent libraries from crashing when they try to access process.env
      'process.env': {}, 
      
      // 2. Safely inject the API key as a distinct global constant
      '__GEMINI_API_KEY__': JSON.stringify(env.API_KEY || ''),
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      sourcemap: false,
    }
  }
})