import { randomBytes, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import mysql from 'mysql2/promise';

let pool;
const sessions = new Map();
const attempts = new Map();
const tables = new Set(['site_content', 'categories', 'products', 'reviews', 'orders', 'order_items', 'appointments', 'customers', 'leads', 'admin_emails']);
const publicTables = new Set(['site_content', 'categories', 'products', 'reviews']);
const publicRpcs = new Set(['place_order', 'book_appointment', 'submit_review', 'submit_lead', 'track_order', 'track_product_event']);
const adminRpcs = new Set(['admin_product_insights', 'admin_hot_leads', 'admin_customer_interests']);
const identifier = value => { if (!/^[a-z_][a-z0-9_]*$/i.test(value)) throw new Error('Invalid database identifier'); return `\`${value}\``; };
export function database() {
  if (!process.env.DB_HOST) return null;
  return pool ??= mysql.createPool({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD, connectionLimit: 5, decimalNumbers: true, dateStrings: true, connectTimeout: 5000 });
}
function normalize(rows) {
  return rows.map(row => {
    for (const key of ['value', 'uses', 'ingredients']) {
      if (typeof row[key] === 'string') { try { row[key] = JSON.parse(row[key]); } catch { /* Plain text is valid. */ } }
    }
    for (const key of ['is_active', 'is_featured']) if (key in row) row[key] = Boolean(row[key]);
    return row;
  });
}
export async function localQuery(q, admin = false) {
  if (!tables.has(q.table) || (!admin && (!publicTables.has(q.table) || q.operation !== 'select'))) throw new Error('Unauthorized query');
  const db = database();
  if (!db) {
    if (q.operation !== 'select') throw new Error('MySQL is disabled. Set DB_HOST in .env.');
    return { data: q.single ? null : [], error: null, count: 0 };
  }
  const table = identifier(q.table);
  const values = [];
  const filters = [...(q.filters || [])];
  if (!admin && q.table === 'products') filters.push(['is_active', '=', true]);
  if (!admin && q.table === 'reviews') filters.push(['status', '=', 'approved']);
  const where = filters.length ? ' WHERE ' + filters.map(([col, op, val]) => {
    if (!['=', '>='].includes(op)) throw new Error('Invalid filter');
    values.push(val); return `${identifier(col)} ${op} ?`;
  }).join(' AND ') : '';
  if (q.operation === 'select') {
    // Relationship fields are loaded separately; identifiers never come directly into SQL.
    const selection = String(q.columns || '*').replace(/\w+\([^)]*\)/g, '').split(',').map(c => c.trim()).filter(Boolean);
    const cols = selection.includes('*') || selection.length === 0 ? '*' : selection.map(identifier).join(',');
    const order = q.orders?.length ? ' ORDER BY ' + q.orders.map(([col, asc]) => `${identifier(col)} ${asc ? 'ASC' : 'DESC'}`).join(',') : '';
    const limit = Math.max(1, Math.min(5000, Number(q.limit) || 5000));
    const [rows] = await db.execute(`SELECT ${cols} FROM ${table}${where}${order} LIMIT ${limit}`, values);
    normalize(rows);
    if (String(q.columns).includes('products(')) {
      for (const row of rows) {
        const [products] = row.product_id ? await db.execute('SELECT name, slug FROM products WHERE id = ?', [row.product_id]) : [[]];
        row.products = products[0] ?? null;
      }
    }
    if (String(q.columns).includes('order_items(')) {
      for (const row of rows) { const [items] = await db.execute('SELECT * FROM order_items WHERE order_id = ?', [row.id]); row.order_items = normalize(items); }
    }
    let count = rows.length;
    if (q.count === 'exact') { const [totals] = await db.execute(`SELECT COUNT(*) AS total FROM ${table}${where}`, values); count = totals[0].total; }
    return { data: q.head ? null : q.single ? rows[0] ?? null : rows, error: null, count };
  }
  if (!admin) throw new Error('Admin login required');
  if (['delete', 'update'].includes(q.operation) && !filters.length) throw new Error('A filter is required');
  if (q.operation === 'delete') await db.execute(`DELETE FROM ${table}${where}`, values);
  else {
    const record = q.values;
    if (!record || Array.isArray(record) || typeof record !== 'object') throw new Error('Expected a record');
    const keys = Object.keys(record);
    if (!keys.length) throw new Error('Empty record');
    const vals = keys.map(k => typeof record[k] === 'object' && record[k] !== null ? JSON.stringify(record[k]) : record[k]);
    if (q.operation === 'update') await db.execute(`UPDATE ${table} SET ${keys.map(k => `${identifier(k)} = ?`).join(',')}${where}`, [...vals, ...values]);
    else if (['insert', 'upsert'].includes(q.operation)) {
      const duplicate = q.operation === 'upsert' ? ' ON DUPLICATE KEY UPDATE ' + keys.map(k => `${identifier(k)} = VALUES(${identifier(k)})`).join(',') : '';
      await db.execute(`INSERT INTO ${table} (${keys.map(identifier).join(',')}) VALUES (${keys.map(() => '?').join(',')})${duplicate}`, vals);
    } else throw new Error('Unknown operation');
  }
  return { data: null, error: null };
}
async function rpc(name, args, admin) {
  if (name === 'is_admin') return admin;
  if (!publicRpcs.has(name) && !(admin && adminRpcs.has(name))) throw new Error('Unauthorized operation');
  const db = database();
  if (!db) throw new Error('MySQL is disabled. This action was not saved.');
  if (publicRpcs.has(name)) {
    const phone = String(args.p_phone || '').replace(/\D/g, '').replace(/^92(?=3)/, '0').replace(/^(3\d{9})$/, '0$1');
    const [result] = await db.execute('CALL local_action_v2(?, ?)', [name, JSON.stringify({ ...args, p_phone: phone })]);
    const value = result[0]?.[0]?.result;
    return typeof value === 'string' ? JSON.parse(value) : value ?? null;
  }
  const days = Math.max(1, Math.min(365, Number(args.p_days) || 30));
  if (name === 'admin_product_insights') {
    const [rows] = await db.execute(`SELECT p.id AS product_id,p.name,p.image_url,
      COALESCE(SUM(e.event='view'),0) AS views,COALESCE(SUM(e.event='add_to_cart'),0) AS carts,
      COALESCE(SUM(e.event='whatsapp'),0) AS whatsapp,COALESCE(SUM(e.event='inquiry'),0) AS inquiries,
      (SELECT COALESCE(SUM(oi.quantity),0) FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE oi.product_id=p.id AND o.status<>'cancelled' AND o.created_at>=CURRENT_TIMESTAMP-INTERVAL ? DAY) AS purchases
      FROM products p LEFT JOIN product_events e ON e.product_id=p.id AND e.created_at>=CURRENT_TIMESTAMP-INTERVAL ? DAY GROUP BY p.id`, [days, days]);
    return rows;
  }
  if (name === 'admin_customer_interests' || name === 'admin_hot_leads') {
    const filter = name === 'admin_customer_interests' ? ' AND c.id=?' : '';
    const values = name === 'admin_customer_interests' ? [days, args.p_customer_id] : [days];
    const [rows] = await db.execute(`SELECT c.id AS customer_id,c.name AS customer_name,c.phone,p.id AS product_id,p.name AS product_name,p.image_url,
      SUM(e.event='view') AS views,SUM(e.event='add_to_cart') AS carts,SUM(e.event='whatsapp') AS whatsapp,SUM(e.event='inquiry') AS inquiries,MAX(e.created_at) AS last_seen,
      (SELECT COALESCE(SUM(oi.quantity),0) FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.customer_id=c.id AND oi.product_id=p.id AND o.status<>'cancelled') AS purchases
      FROM customers c JOIN product_events e ON JSON_CONTAINS(c.visitor_ids,JSON_QUOTE(e.visitor_id)) JOIN products p ON p.id=e.product_id
      WHERE e.created_at>=CURRENT_TIMESTAMP-INTERVAL ? DAY${filter} GROUP BY c.id,p.id
      ${name === 'admin_hot_leads' ? "HAVING purchases=0 AND (views>=2 OR carts>0 OR inquiries>0)" : ''} ORDER BY last_seen DESC LIMIT 100`, values);
    return rows;
  }
  const [parameters] = await db.execute('SELECT PARAMETER_NAME FROM information_schema.PARAMETERS WHERE SPECIFIC_SCHEMA = ? AND SPECIFIC_NAME = ? ORDER BY ORDINAL_POSITION', [process.env.DB_NAME, name]);
  if (!parameters.length) throw new Error(`MySQL procedure ${name} is missing. The Lovable PostgreSQL schema must be migrated before this action can be saved.`);
  const values = parameters.map(({ PARAMETER_NAME }) => {
    if (!(PARAMETER_NAME in args)) throw new Error(`Missing parameter ${PARAMETER_NAME}`);
    const value = args[PARAMETER_NAME]; return value !== null && typeof value === 'object' ? JSON.stringify(value) : value;
  });
  const [results] = await db.execute(`CALL ${identifier(name)}(${values.map(() => '?').join(',')})`, values);
  return results[0];
}
function secureEqual(a, b) { const x = Buffer.from(a || ''); const y = Buffer.from(b || ''); return x.length === y.length && timingSafeEqual(x, y); }
function mediaPath(path) {
  if (!/^[a-zA-Z0-9/_\-.]{3,200}$/.test(path) || path.includes('..')) throw new Error('Invalid media path');
  const root = resolve('.local-media'); const target = resolve(root, path);
  if (!target.startsWith(root + sep)) throw new Error('Invalid media path');
  return target;
}
export function localRuntimePlugin() {
  return {
    name: 'local-mysql-runtime',
    configureServer(server) {
      server.middlewares.use(localMiddleware);
    },
  };
}

export async function localMiddleware(req, res, next) {
        if (req.url?.startsWith('/api/public/media/')) {
          try {
            const path = decodeURIComponent(req.url.split('?')[0].slice('/api/public/media/'.length));
            const data = await readFile(mediaPath(path));
            const ext = path.split('.').pop()?.toLowerCase();
            const types = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', avif: 'image/avif' };
            res.setHeader('Content-Type', types[ext] || 'application/octet-stream'); res.setHeader('X-Content-Type-Options', 'nosniff'); res.end(data);
          } catch { res.statusCode = 404; res.end('Not found'); }
          return;
        }
        if (req.url !== '/api/local') return next();
        res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store');
        try {
          if (req.method !== 'POST' || !req.headers['content-type']?.startsWith('application/json')) throw new Error('JSON POST required');
          const origin = process.env.APP_URL ? new URL(process.env.APP_URL).origin : `http://${req.headers.host}`;
          if (req.headers.origin && req.headers.origin !== origin) throw new Error('Invalid origin');
          const secureCookie = origin.startsWith('https:') ? '; Secure' : '';
          let body = ''; for await (const chunk of req) { body += chunk; if (body.length > 8 * 1024 * 1024) throw new Error('Request too large'); }
          const p = JSON.parse(body);
          const token = req.headers.cookie?.match(/(?:^|; )kr_session=([a-f0-9]+)/)?.[1];
          const expires = sessions.get(token); const admin = !!expires && expires > Date.now();
          const user = { id: 'local-admin', email: process.env.ADMIN_USERNAME };
          let data = null;
          if (p.action === 'login') {
            const address = req.socket.remoteAddress; const now = Date.now(); const previous = attempts.get(address);
            const attempt = previous && previous.until > now ? previous : { count: 0, until: now + 60000 };
            attempts.set(address, attempt);
            if (++attempt.count > 10) throw new Error('Too many attempts. Try again in one minute.');
            if (!process.env.ADMIN_PASSWORD || !secureEqual(p.credentials?.email, process.env.ADMIN_USERNAME) || !secureEqual(p.credentials?.password, process.env.ADMIN_PASSWORD)) throw new Error('Invalid email or password');
            for (const [key, expiry] of sessions) if (expiry < now) sessions.delete(key);
            if (token) sessions.delete(token);
            const id = randomBytes(32).toString('hex'); sessions.set(id, now + 8 * 3600000);
            res.setHeader('Set-Cookie', `kr_session=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${secureCookie}`); data = { user };
          } else if (p.action === 'logout') { sessions.delete(token); res.setHeader('Set-Cookie', `kr_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secureCookie}`); }
          else if (p.action === 'session') data = admin ? { user } : null;
          else if (p.action === 'query') { if (!admin) throw new Error('Admin login required'); res.end(JSON.stringify(await localQuery(p.query, true))); return; }
          else if (p.action === 'rpc') data = await rpc(p.name, p.args || {}, admin);
          else if (p.action === 'upload') {
            if (!admin) throw new Error('Admin login required');
            const ext = String(p.path).split('.').pop()?.toLowerCase();
            if (!['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'].includes(ext)) throw new Error('Unsupported image type');
            const target = mediaPath(p.path); await mkdir(resolve(target, '..'), { recursive: true }); await writeFile(target, Buffer.from(p.data, 'base64'), { flag: 'wx' });
          } else throw new Error('Unknown action');
          res.end(JSON.stringify({ data, error: null }));
        } catch (error) {
          const code = error.code;
          const message = code === 'ER_SIGNAL_EXCEPTION' ? error.sqlMessage : code ? `MySQL operation failed (${code}). Check .env and the existing MySQL tables/procedures.` : error.message;
          res.statusCode = 400; res.end(JSON.stringify({ data: null, error: { message } }));
        }
}
