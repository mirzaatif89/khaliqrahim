import { readFile } from 'node:fs/promises';
import { database } from './local-runtime.mjs';
import { installProcedures } from './local-procedures.mjs';

// Local MySQL schema is separate from Lovable's managed PostgreSQL migrations.
export async function initializeDatabase() {
  const db = database();
  if (!db) { console.log('MySQL disabled: preview uses default content and an empty catalog.'); return; }
  const source = await readFile(new URL('../drizzle/migrations/0000_store_clinic_core.sql', import.meta.url), 'utf8');
  for (const match of source.matchAll(/create table public\.(\w+) \(([\s\S]*?)\n\);/g)) {
    if (match[1] === 'user_roles') continue;
    const columns = match[2].split('\n').filter(Boolean).map(line => {
      line = line.replace(/references (?:public\.)?\w+\(\w+\) on delete (?:set null|cascade)/g, '')
        .replace(/\buuid\b/g, 'char(36)').replace(/default gen_random_uuid\(\)/g, 'default (uuid())')
        .replace(/bigint generated always as identity/g, 'bigint auto_increment')
        .replace(/text\[\] not null default '\{\}'/g, "json not null default (json_array())")
        .replace(/jsonb not null default '\{\}'::jsonb/g, 'json not null default (json_object())')
        .replace(/timestamptz/g, 'datetime').replace(/default now\(\)/g, 'default CURRENT_TIMESTAMP');
      if (/\btext\b/.test(line)) line = line.replace(/\btext\b/g, /primary key|unique|default/.test(line) ? 'varchar(191)' : 'text');
      return line.replace(/^(\s*)key\b/, '$1`key`');
    });
    await db.query(`CREATE TABLE IF NOT EXISTS \`${match[1]}\` (${columns.join('\n')}) ENGINE=InnoDB`);
  }
  const [constraints] = await db.query('SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA=DATABASE()');
  const known = new Set(constraints.map(row => row.CONSTRAINT_NAME));
  for (const match of source.matchAll(/create table public\.(\w+) \(([\s\S]*?)\n\);/g)) {
    if (match[1] === 'user_roles') continue;
    for (const ref of match[2].matchAll(/^\s*(\w+) uuid[^\n]*references public\.(\w+)\((\w+)\) on delete (set null|cascade)/gm)) {
      const name = `local_fk_${match[1]}_${ref[1]}`;
      if (!known.has(name)) await db.query(`ALTER TABLE \`${match[1]}\` ADD CONSTRAINT \`${name}\` FOREIGN KEY (\`${ref[1]}\`) REFERENCES \`${ref[2]}\` (\`${ref[3]}\`) ON DELETE ${ref[4]}`);
    }
  }
  // Seed only missing rows; existing local edits are preserved on restart.
  for (const m of source.matchAll(/\('(clinic|home|about|store)', '([\s\S]*?)'::jsonb\)/g)) {
    const value = JSON.parse(m[2].replace(/''/g, "'"));
    if (m[1] === 'store') Object.assign(value, { delivery_fee: 0, free_delivery_over: 0, delivery_time: 'Ready for pickup at the clinic, usually the same day' });
    if (m[1] === 'home') value.announcement = 'Order medicines online · Pick up & pay at the clinic · WhatsApp 0333-0501084';
    if (m[1] === 'about') value.mission = 'To make safe, gentle and individualized homeopathic care easy to reach — in our clinic and online.';
    await db.execute('INSERT IGNORE INTO site_content (`key`, value) VALUES (?, ?)', [m[1], JSON.stringify(value)]);
  }
  const categories = source.split('-- SEED: CATEGORIES')[1].split('-- SEED: PRODUCTS')[0];
  for (const row of tuples(categories.slice(categories.indexOf('values') + 6))) {
    await db.execute('INSERT IGNORE INTO categories (name, slug, description, tone, icon, sort_order) VALUES (?,?,?,?,?,?)', row);
  }
  const products = source.split('from (values')[1].split(') as v(')[0];
  for (const row of tuples(products)) {
    const [slug, name, cat, price, compare, size, short, descr, uses, dosage, ingr, img, featured, sort] = row;
    await db.execute('INSERT IGNORE INTO products (slug,name,category_id,price,compare_at_price,size,short_description,description,uses,dosage,ingredients,image_url,stock,is_featured,sort_order) SELECT ?,?,id,?,?,?,?,?,?,?,?,?,100,?,? FROM categories WHERE slug=?', [slug,name,price,compare,size,short,descr,JSON.stringify(uses),dosage,ingr,img,featured,sort,cat]);
  }
  await db.query('CREATE TABLE IF NOT EXISTS local_sequences (name varchar(40) PRIMARY KEY, value int NOT NULL)');
  await db.query("INSERT IGNORE INTO local_sequences VALUES ('order',1000),('ticket',1000)");
  await installProcedures(db);
  console.log('Local MySQL schema and catalog ready.');
}
// Parse only the literal VALUES rows shipped with this repository; never eval SQL.
function tuples(text) {
  let i = 0;
  function skip() { while (/\s/.test(text[i] || '') && i < text.length) i++; }
  function value() {
    skip();
    if (text.startsWith('array[', i)) { i += 6; const result = []; while (true) { result.push(value()); skip(); if (text[i++] === ']') return result; } }
    if (text[i] === "'") {
      i++; let s = ''; while (i < text.length) { if (text[i] === "'") { if (text[i + 1] === "'") { s += "'"; i += 2; } else { i++; break; } } else s += text[i++]; } return s;
    }
    const m = text.slice(i).match(/^(null(?:::int)?|true|false|-?\d+)/); if (!m) throw new Error('Invalid seed literal');
    i += m[0].length; return m[0].startsWith('null') ? null : m[0] === 'true' ? true : m[0] === 'false' ? false : Number(m[0]);
  }
  const rows = [];
  while (i < text.length) {
    skip(); if (text[i] === ',' || text[i] === ';') { i++; continue; } if (text[i] !== '(') break;
    i++; const row = []; while (true) { row.push(value()); skip(); if (text[i++] === ')') break; } rows.push(row);
  }
  return rows;
}
