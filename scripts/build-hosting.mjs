// Shared hosting often limits processes/threads despite exposing many CPU cores.
// Set native pool limits before importing Vite/Rolldown.
process.env.RAYON_NUM_THREADS ||= '1';
process.env.ROLLDOWN_WORKER_THREADS ||= '1';
process.env.TOKIO_WORKER_THREADS ||= '1';

process.env.MYSQL_RUNTIME = 'true';
delete process.env.LOCAL_RUNTIME;
const { createBuilder } = await import('vite');
const builder = await createBuilder();
await builder.buildApp();
