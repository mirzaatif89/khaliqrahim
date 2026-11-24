import { cp, mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const target = resolve('artifacts/cpanel');
await stat('.output-hosting/server/index.mjs');
await mkdir(target, { recursive: true });
for (const file of ['app.cjs', 'CPANEL.md', '.output-hosting']) await cp(file, resolve(target, file), { recursive: true, force: true });
for (const file of ['local-runtime.mjs', 'init-local-db.mjs', 'local-procedures.mjs', 'serve-hosting.mjs', 'setup-hosting-db.mjs']) {
  await mkdir(resolve(target, 'scripts'), { recursive: true });
  await cp(`scripts/${file}`, resolve(target, 'scripts', file));
}
await mkdir(resolve(target, 'drizzle/migrations'), { recursive: true });
await cp('drizzle/migrations/0000_store_clinic_core.sql', resolve(target, 'drizzle/migrations/0000_store_clinic_core.sql'));
await cp('hosting/.env.example', resolve(target, '.env.example'));
const source = JSON.parse(await readFile('package.json', 'utf8'));
await writeFile(resolve(target, 'package.json'), JSON.stringify({
  name: 'khaliqrahim-hosting', version: '1.0.0', private: true,
  engines: { node: '>=22.12.0' },
  scripts: { start: 'node app.cjs', 'db:setup': 'node scripts/setup-hosting-db.mjs' },
  dependencies: { dotenv: source.dependencies.dotenv, mysql2: source.dependencies.mysql2 },
}, null, 2) + '\n');
console.log(`Hosting files prepared in ${target}. Zip this directory's contents, including .output-hosting and .env.example. Never include .env.`);
