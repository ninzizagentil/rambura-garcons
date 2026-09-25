import { defineConfig, createLogger } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Where the API runs. Change it with BACKEND_URL (for example when port 5000 is already used on your computer).
// 127.0.0.1 is used instead of "localhost" because some computers resolve localhost to IPv6 (::1) first,
// which gives "connect ECONNREFUSED ::1:5000" even though the backend is running.
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:5000'

// Without this, every request made while the backend is stopped or restarting prints a long
// "http proxy error" stack in this terminal (the app asks for notifications every few seconds).
// Now: one short explanation at most every 15 seconds, and the browser gets a clear 503 message.
function backendProxy() {
  let lastWarning = 0
  return {
    target: BACKEND_URL,
    changeOrigin: true,
    configure: (proxy) => {
      proxy.on('error', (error, _req, res) => {
        if (Date.now() - lastWarning > 15000) {
          lastWarning = Date.now()
          console.warn(`\n[proxy] Cannot reach the backend at ${BACKEND_URL} (${error.code || error.message}).\n` +
            '        1) Is the backend running?  npm run dev:backend\n' +
            '        2) Is MongoDB running?      (the backend needs it)\n' +
            '        3) Is port 5000 used by another program? Set PORT in backend/.env and BACKEND_URL here.\n')
        }
        if (res && typeof res.writeHead === 'function' && !res.headersSent) {
          res.writeHead(503, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ success: false, message: 'The backend server is not running. Start it with "npm run dev:backend" and try again.', errors: [] }))
        }
      })
    },
  }
}

// Vite prints its own long "http proxy error" + stack for every failed request. Hide only those lines;
// the short [proxy] explanation above and every other message stay visible.
const logger = createLogger()
const logError = logger.error
logger.error = (message, options) => {
  if (typeof message === 'string' && message.includes('http proxy error')) return
  logError(message, options)
}

// https://vite.dev/config/
export default defineConfig({
  customLogger: logger,
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Split large third-party libraries into their own cacheable
        // chunks instead of one monolithic bundle, so a change to app
        // code doesn't force users to re-download React/recharts/etc.,
        // and the browser can fetch/cache these in parallel.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-vendor')) {
            return 'charts-vendor';
          }
          if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) {
            return 'motion-vendor';
          }
          if (id.includes('lucide-react')) {
            return 'icons-vendor';
          }
          if (id.includes('react-dom') || id.includes('react-router') || /node_modules\/react\//.test(id)) {
            return 'react-vendor';
          }
          return 'vendor';
        },
      },
    },
  },
  server: {
    host: 'localhost',
    port: 5173,
    // Fail with a clear message instead of silently moving to 5174 (password-reset links and CORS expect 5173).
    strictPort: true,
    proxy: {
      '/api': backendProxy(),
      // Uploaded images are saved as /uploads/... and served by the backend.
      '/uploads': backendProxy(),
    },
  },
})
