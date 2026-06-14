import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Split node_modules into per-package chunks to reduce large single bundles
        manualChunks(id) {
          if (id.includes('node_modules')) {
            const parts = id.toString().split('node_modules/')[1].split('/');
            // handle scoped packages like @mui/material
            if (parts[0].startsWith('@')) return `${parts[0]}/${parts[1]}`;
            return parts[0];
          }
        }
      }
    },
    // Raise warning limit slightly while chunks get rebalanced
    chunkSizeWarningLimit: 2000
  }
})