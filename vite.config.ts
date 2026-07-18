import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        id: '/',
        name: 'White Room 2.0 System',
        short_name: 'WR System',
        description: 'Gamifiziertes Trainingssystem — XP, Stats, Quests, Strafen.',
        start_url: '/',
        scope: '/',
        theme_color: '#050a14',
        background_color: '#050a14',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Push-/notificationclick-Handler in den generierten SW einziehen (generateSW bleibt).
        importScripts: ['/push-sw.js'],
      },
    }),
  ],
})
