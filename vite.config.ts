import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'Berkah Rezeki Tani',
        short_name: 'BRT Kasir',
        description: 'Aplikasi kasir dan manajemen stok toko',
        theme_color: '#16a34a',
        icons: [
          {
            src: '/brt-icon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/brt-icon.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
