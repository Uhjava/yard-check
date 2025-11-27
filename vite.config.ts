import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Define the whole process.env object to prevent "process is not defined" errors
      // and safely inject the API_KEY
      'process.env': {
        API_KEY: env.API_KEY || '',
        NODE_ENV: mode
      }
    },
  }
})