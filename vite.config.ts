import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Safely inject ONLY the API key as a string replacement
      // This avoids "process is not defined" issues when accessing nested properties
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
  }
})