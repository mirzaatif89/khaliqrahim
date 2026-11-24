import 'dotenv/config';
import { initializeDatabase } from './init-local-db.mjs';
import { database } from './local-runtime.mjs';

try { await initializeDatabase(); }
finally { await database()?.end(); }
