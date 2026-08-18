import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/kalkulator-bantuan-am-persekolahan/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Kalkulator Bantuan Am Persekolahan',
        short_name: 'Kalkulator BAP',
        description: 'Unjuran kelulusan dan peruntukan Bantuan Am Persekolahan.',
        theme_color: '#0f766e',
        background_color: '#f4f7f6',
        display: 'standalone',
        start_url: './',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
  build: { sourcemap: true },
}))
