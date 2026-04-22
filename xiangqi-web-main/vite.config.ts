import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })),
    __BUILD_NAME__: JSON.stringify(process.env.BUILD_NAME || 'dev'),
    __GOOGLE_CLIENT_ID__: JSON.stringify((process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '').trim())
  },
  build: {
    chunkSizeWarningLimit: 700,
    cssCodeSplit: true, // Split CSS into chunks for faster FCP/LCP by only loading what is needed
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') && (id.includes('react-dom') || id.includes('scheduler'))) return 'vendor-react';
            if (id.includes('socket.io-client')) return 'vendor-socket';
            if (id.includes('i18next')) return 'vendor-i18n';
            if (id.includes('react-router-dom') || id.includes('@remix-run') || id.includes('react-router')) return 'vendor-router';
            if (id.includes('framer-motion')) return 'vendor-motion';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('recharts')) return 'vendor-charts';
            if (id.includes('tinymce')) return 'vendor-editor';
            if (id.includes('axios')) return 'vendor-axios';
            if (id.includes('@dnd-kit')) return 'vendor-dnd';
            return 'vendor';
          }
        },
      }
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api/export': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
        changeOrigin: true
      },
      '/sitemap.xml': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/sitemap-main.xml': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/sitemap-puzzles.xml': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/sitemap-players.xml': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/sitemap-content.xml': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})
