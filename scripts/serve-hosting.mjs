import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { localMiddleware } from './local-runtime.mjs';

const types = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.txt': 'text/plain', '.xml': 'application/xml' };

export async function startHosting() {
  for (const name of ['DB_HOST', 'DB_NAME', 'DB_USER', 'ADMIN_USERNAME', 'ADMIN_PASSWORD', 'APP_URL']) {
    if (!process.env[name]) throw new Error(`Set ${name} in the hosting .env or cPanel environment variables.`);
  }
  const appUrl = new URL(process.env.APP_URL);
  if (!['http:', 'https:'].includes(appUrl.protocol) || appUrl.pathname !== '/' || appUrl.search || appUrl.hash) throw new Error('APP_URL must be your domain origin, without a path or query.');
  const root = resolve('.output-hosting/public');
  const { middleware } = await import(pathToFileURL(resolve('.output-hosting/server/index.mjs')).href);
  const server = createServer(async (req, res) => {
    try {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      // Keep the unbuilt MySQL/auth middleware on the same origin as the SSR app.
      await localMiddleware(req, res, async () => {
        try {
          const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
          const target = resolve(root, '.' + pathname);
          if (target.startsWith(root + sep) && !pathname.split('/').some(part => part.startsWith('.'))) {
            const file = await stat(target).catch(() => null);
            if (file?.isFile() && ['GET', 'HEAD'].includes(req.method)) {
              res.setHeader('Content-Type', types[extname(target).toLowerCase()] || 'application/octet-stream');
              res.setHeader('Content-Length', file.size);
              res.setHeader('Cache-Control', pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=3600');
              if (req.method === 'HEAD') res.end();
              else createReadStream(target).on('error', () => res.destroy()).pipe(res);
              return;
            }
          }
          await middleware(req, res);
        } catch (error) { console.error('Request failed:', error.message); if (!res.headersSent) res.writeHead(500); res.end('Request failed'); }
      });
    } catch (error) { console.error('Request failed:', error.message); if (!res.headersSent) res.writeHead(500); res.end('Request failed'); }
  });
  // Passenger intercepts listen(); do not bind to loopback in production.
  server.listen(process.env.PORT || 3000, () => console.log(`Website ready for ${appUrl.origin}`));
  return server;
}
