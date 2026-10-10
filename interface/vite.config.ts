import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import http from 'node:http';

function gracefulBackendProxy(): Plugin {
  return {
    name: 'graceful-backend-proxy',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url || !req.url.startsWith('/api')) {
          return next();
        }

        const proxyReq = http.request(
          {
            hostname: '127.0.0.1',
            port: 5000,
            path: req.url,
            method: req.method,
            headers: {
              ...req.headers,
              host: '127.0.0.1:5000',
            },
          },
          (proxyRes) => {
            res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
            proxyRes.pipe(res);
          }
        );

        proxyReq.on('error', () => {
          // Quando o backend C# .NET não estiver rodando na porta 5000,
          // responder de forma limpa (503 Service Unavailable) sem emitir
          // logs de erro não tratados no console do Vite.
          if (!res.headersSent) {
            res.writeHead(503, {
              'Content-Type': 'application/json',
            });
            res.end(
              JSON.stringify({
                status: 'offline',
                connected: false,
                message: 'Backend C# .NET 9 não iniciado. Operando em modo offline local.',
              })
            );
          }
        });

        req.pipe(proxyReq);
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), gracefulBackendProxy()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
});

