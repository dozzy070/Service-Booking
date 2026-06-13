import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries into separate chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@mui/material', '@emotion/react', '@emotion/styled'],
          'vendor-charts': ['recharts', 'chart.js'],
          'vendor-utils': ['axios', 'date-fns', 'lodash']
        }
      }
    },
    // Increase warning limit (optional)
    chunkSizeWarningLimit: 1000
  }
})