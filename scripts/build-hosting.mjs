import { createBuilder } from 'vite';

process.env.MYSQL_RUNTIME = 'true';
delete process.env.LOCAL_RUNTIME;
const builder = await createBuilder();
await builder.buildApp();
