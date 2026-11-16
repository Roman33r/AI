import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { inspectAttr } from 'kimi-plugin-inspect-react'

export default defineConfig({
  base: './',
  plugins: [
    inspectAttr(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'AI / 52 — интерактивная программа',
        short_name: 'AI / 52',
        description: '53 недели AI-инжиниринга и собственная нейросеть Neuro/52 с нуля',
        theme_color: '#173a3a',
        background_color: '#f8f8f8',
        display: 'standalone',
        start_url: './',
        scope: './',
        lang: 'ru',
        icons: [
          { src: './icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: './icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: './icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
        runtimeCaching: [],
      },
    }),
  ],
  server: { port: 3000 },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
})
