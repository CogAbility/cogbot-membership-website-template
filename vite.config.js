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
      dedupe: ['react', 'react-dom', 'react-router-dom', 'oidc-client-ts'],
    },
    server: {
      port: Number(env.VITE_DEV_PORT) || 5175,
      proxy: {
        '/cogbot-api': {
          target: env.VITE_COGBOT_HOST || 'http://localhost:8085',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/cogbot-api/, ''),
          secure: false,
          configure: (proxy) => {
            proxy.on('proxyRes', (proxyRes) => {
              if ((proxyRes.headers['content-type'] || '').includes('text/event-stream')) {
                proxyRes.headers['cache-control'] = 'no-cache';
                proxyRes.headers['x-accel-buffering'] = 'no';
              }
            });
          },
        },
      },
    },
  }
})
