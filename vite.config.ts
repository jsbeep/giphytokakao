import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, loadEnv, type HtmlTagDescriptor, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { giphyConfigFromEnv } from './api/_config'
import {
  DEFAULT_SEARCH_LIMIT,
  DEFAULT_TREND_LIMIT,
  handleGiphyRequest,
  type GiphyHandlerConfig,
} from './api/_giphyHandler'
import { handleShareRequest } from './api/_shareHandler'

const giphyDevApi = (config: GiphyHandlerConfig): Plugin => ({
  name: 'giphy-dev-api',
  configureServer(server) {
    server.middlewares.use('/api/giphy', (req, res) => {
      void handleGiphyRequest(req, res, config)
    })
    server.middlewares.use('/api/share', (req, res) => {
      handleShareRequest(req, res)
    })
  },
})

/** seo/* templates served at the site root, keyed by file name */
const SEO_TEMPLATES: Record<string, string> = {
  'robots.txt': 'text/plain; charset=utf-8',
  'sitemap.xml': 'application/xml; charset=utf-8',
  'llms.txt': 'text/plain; charset=utf-8',
}

/** fills %VITE_*% placeholders in index.html and seo/* so deploy-specific URLs live in .env */
const siteEnv = (env: Record<string, string>): Plugin => {
  const vars: Record<string, string> = {
    VITE_SITE_URL: (env.VITE_SITE_URL || '').replace(/\/+$/, ''),
    VITE_GITHUB_URL: env.VITE_GITHUB_URL || '',
  }
  const render = (text: string) => text.replace(/%(VITE_[A-Z_]+)%/g, (match, name: string) => vars[name] ?? match)
  let root = process.cwd()
  const readTemplate = (name: string) => render(readFileSync(resolve(root, 'seo', name), 'utf8'))

  return {
    name: 'site-env',
    configResolved(config) {
      root = config.root
      if (config.command === 'build' && !vars.VITE_SITE_URL) {
        config.logger.warn('VITE_SITE_URL is not set: canonical, og:url and sitemap URLs will be relative.')
      }
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const tags: HtmlTagDescriptor[] = env.VITE_GOOGLE_SITE_VERIFICATION
          ? [{ tag: 'meta', attrs: { name: 'google-site-verification', content: env.VITE_GOOGLE_SITE_VERIFICATION }, injectTo: 'head' }]
          : []
        return { html: render(html), tags }
      },
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const name = (req.url || '').split('?')[0].replace(/^\//, '')
        const contentType = SEO_TEMPLATES[name]
        if (!contentType) {
          next()
          return
        }
        res.setHeader('Content-Type', contentType)
        res.end(readTemplate(name))
      })
    },
    generateBundle() {
      for (const name of Object.keys(SEO_TEMPLATES)) {
        this.emitFile({ type: 'asset', fileName: name, source: readTemplate(name) })
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const giphyConfig = giphyConfigFromEnv(env)

  return {
    base: './',
    plugins: [react(), tailwindcss(), giphyDevApi(giphyConfig), siteEnv(env)],
    // the browser calls GIPHY directly when a visitor brings their own key, so it needs the same limits
    define: {
      __GIPHY_TREND_LIMIT__: JSON.stringify(giphyConfig.trendLimit ?? DEFAULT_TREND_LIMIT),
      __GIPHY_SEARCH_LIMIT__: JSON.stringify(giphyConfig.searchLimit ?? DEFAULT_SEARCH_LIMIT),
    },
    server: {
      host: '0.0.0.0',
      port: 31500,
      strictPort: true,
    },
    preview: {
      host: '0.0.0.0',
      port: 31500,
      strictPort: true,
    },
  }
})
