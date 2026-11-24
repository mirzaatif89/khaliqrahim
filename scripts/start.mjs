import 'dotenv/config';
import { createServer } from 'vite';
import { initializeDatabase } from './init-local-db.mjs';

process.env.LOCAL_RUNTIME = 'true';
await initializeDatabase();
const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
const server = await createServer({ server: { host: '127.0.0.1', port, strictPort: true } });
await server.listen();
server.printUrls();
