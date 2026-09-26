import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

// Dev proxy plugin for /api/sheets-proxy
function sheetsProxyPlugin(): Plugin {
  return {
    name: 'sheets-proxy-dev',
    configureServer(server) {
      server.middlewares.use('/api/sheets-proxy', async (req, res) => {
        // Enable CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', '*');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        const reqUrl = new URL(req.url || '', 'http://localhost:3000');
        const targetUrl = reqUrl.searchParams.get('url');

        if (!targetUrl) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Parameter url diperlukan.' }));
          return;
        }

        try {
          const decodedUrl = decodeURIComponent(targetUrl);

          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', async () => {
              try {
                const forwardRes = await fetch(decodedUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: body || '{}'
                });
                const responseText = await forwardRes.text();
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(responseText);
              } catch (e: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: e.message }));
              }
            });
            return;
          }

          // GET
          const forwardRes = await fetch(decodedUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
            }
          });

          const contentType = forwardRes.headers.get('content-type') || '';
          const responseData = await forwardRes.text();

          res.statusCode = forwardRes.status;
          if (contentType.includes('application/json') || responseData.trim().startsWith('{') || responseData.trim().startsWith('[')) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
          } else {
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
          }
          res.end(responseData);
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message || 'Error proxying request' }));
        }
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), sheetsProxyPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
