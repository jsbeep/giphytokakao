import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { handleGiphyRequest, type GiphyHandlerConfig } from './api/_giphyHandler'
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

const parseLimit = (value: string | undefined) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      giphyDevApi({
        apiKey: env.GIPHY_API_KEY,
        trendLimit: parseLimit(env.GIPHY_TREND_LIMIT),
        searchLimit: parseLimit(env.GIPHY_SEARCH_LIMIT),
      }),
    ],
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
