import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import siteConfig from './site.config.js'

function siteMetaPlugin(config) {
  const title = config.meta?.title || `${config.botName} | ${config.siteName}`
  const description = config.meta?.description || config.hero?.subtitle || ''
  const ogImage = config.meta?.ogImage || ''

  return {
    name: 'site-meta',
    transformIndexHtml(html) {
      return html
        .replace(/%SITE_TITLE%/g, title)
        .replace(/%SITE_DESCRIPTION%/g, description)
        .replace(/%OG_IMAGE%/g, ogImage)
        .replace(/%FAVICON%/g, config.images?.favicon || '/favicon.svg')
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    plugins: [
      react(),
      siteMetaPlugin(siteConfig),
    ],
    resolve: {
      alias: {
        '@/site.config': path.resolve(__dirname, 'site.config.js'),
      },
    },
    server: {
      port: 5174,
      proxy: {
        '/cogbot-api': {
          target: env.VITE_COGBOT_HOST || 'https://cogbot-widget.mc-cap1.cogability.net',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/cogbot-api/, ''),
          secure: true,
        },
      },
    },
  }
})
