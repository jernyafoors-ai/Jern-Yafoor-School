import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const REPO_NAME = 'zeniaford-assets'

export default defineConfig(({ command }) => {
  // Use repository base path during production build (GitHub Pages)
  // Use '/' during local development so localhost:5173 works seamlessly without white screens
  const base = command === 'build' ? `/${REPO_NAME}/` : '/'

  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'Jern Yafoor School Asset Management App',
          short_name: 'School Assets',
          description: 'School asset tracking: rooms, scanning, transfers',
          theme_color: '#14342b',
          background_color: '#f6f4ee',
          display: 'standalone',
          start_url: base,
          scope: base,
          icons: [
            { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
          ]
        }
      })
    ]
  }
})
