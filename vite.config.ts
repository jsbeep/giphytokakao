import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { handleGiphyRequest } from './api/_giphyHandler'

const giphyDevApi = (apiKey: string | undefined): Plugin => ({
  name: 'giphy-dev-api',
  configureServer(server) {
    server.middlewares.use('/api/giphy', (req, res) => {
      void handleGiphyRequest(req, res, apiKey)
    })
  },
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: './',
    plugins: [react(), tailwindcss(), giphyDevApi(env.GIPHY_API_KEY)],
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
