import 'dotenv/config';
import assert from 'node:assert/strict';
import { database } from './local-runtime.mjs';

const db = database();
const base = `http://127.0.0.1:${process.env.PORT || 3000}`;
let cookie = '';
async function call(action, payload = {}) {
  const r = await fetch(`${base}/api/local`, { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ action, ...payload }) });
  if (r.headers.get('set-cookie')) cookie = r.headers.get('set-cookie').split(';')[0];
  return r.json();
}
const common = { p_name: 'Local Smoke Test', p_phone: '03000000001', p_email: 'test@example.invalid', p_visitor: 'local-smoke-test' };
try {
  assert((await call('query', { query: { table: 'orders', operation: 'select' } })).error);
  assert((await call('login', { credentials: { email: process.env.ADMIN_USERNAME, password: 'wrong' } })).error);
  assert.equal((await call('login', { credentials: { email: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD } })).error, null);
  assert.equal((await call('rpc', { name: 'is_admin' })).data, true);
  const products = await call('query', { query: { table: 'products', operation: 'select' } });
  assert(products.data.length > 0);
  const p = products.data.find(p => p.stock > 0);
  const args = { ...common, p_address: 'Clinic pickup test', p_city: 'Clinic pickup', p_notes: 'Temporary verification', p_payment_method: 'cod', p_payment_reference: '', p_items: [{ product_id: p.id, quantity: 1, price: 1 }] };
  const order = await call('rpc', { name: 'place_order', args });
  assert.equal(order.error, null, JSON.stringify(order));
  const [settings] = await db.query("SELECT value FROM site_content WHERE `key`='store'");
  const s = typeof settings[0].value === 'string' ? JSON.parse(settings[0].value) : settings[0].value;
  const fee = s.free_delivery_over > 0 && p.price >= s.free_delivery_over ? 0 : s.delivery_fee;
  assert.equal(order.data.total, p.price + fee);
  const tracked = await call('rpc', { name: 'track_order', args: { p_order_number: order.data.order_number, p_phone: common.p_phone } });
  assert.equal(tracked.data.items.length, 1); assert.equal(tracked.data.total, order.data.total);
  assert.equal((await call('rpc', { name: 'track_order', args: { p_order_number: order.data.order_number, p_phone: '03000000002' } })).data, null);
  assert((await call('rpc', { name: 'place_order', args: { ...args, p_items: [{ product_id: p.id, quantity: 999 }] } })).error);
  for (const [name, extra] of [
    ['submit_lead', { p_product_id: null, p_source: 'contact', p_message: 'Temporary test' }],
    ['submit_review', { p_product_id: p.id, p_city: 'Test', p_rating: 5, p_comment: 'Temporary smoke test review' }],
    ['track_product_event', { p_product_id: p.id, p_event: 'view' }],
  ]) { const r = await call('rpc', { name, args: { ...common, ...extra } }); assert.equal(r.error, null, JSON.stringify(r)); }
  const date = new Date(); date.setUTCDate(date.getUTCDate() + 1); if (date.getUTCDay() === 0) date.setUTCDate(date.getUTCDate() + 1);
  const appointment = await call('rpc', { name: 'book_appointment', args: { ...common, p_age: null, p_gender: '', p_type: 'in_clinic', p_date: date.toISOString().slice(0, 10), p_time: '9:00 AM', p_complaint: 'Temporary test' } });
  assert.equal(appointment.error, null, JSON.stringify(appointment)); assert.equal(typeof appointment.data.fee, 'number');
  for (const name of ['admin_product_insights', 'admin_hot_leads']) assert.equal((await call('rpc', { name, args: { p_days: 30 } })).error, null);
  const images = new Set();
  for (const path of ['/', '/about', '/shop', `/shop/${p.slug}`, '/services', '/contact', '/reviews', '/auth', '/appointment']) {
    const response = await fetch(base + path); assert.equal(response.status, 200, path);
    const html = await response.text();
    for (const match of html.matchAll(/<img[^>]*src="([^"]*)"/g)) images.add(match[1]);
  }
  for (const product of products.data) if (product.image_url?.startsWith('/')) images.add(product.image_url);
  for (const src of images) {
    assert(src, 'Image src must not be empty');
    const response = await fetch(new URL(src, base));
    assert.equal(response.status, 200, src);
    assert(response.headers.get('content-type')?.startsWith('image/'), `Expected image content: ${src}`);
    assert((await response.arrayBuffer()).byteLength > 0, `Empty image: ${src}`);
  }
  console.log(`PASS: ${images.size} unique image URLs across public pages and the full product catalog.`);
  await call('logout'); assert.equal((await call('session')).data, null);
  console.log('PASS: public pages, authentication, authorization, catalog, trusted prices, tracking privacy, invalid order, inquiry, review, event, appointment, insights, logout.');
} finally {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("UPDATE products p JOIN (SELECT oi.product_id,SUM(oi.quantity) qty FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.visitor_id='local-smoke-test' GROUP BY oi.product_id) t ON t.product_id=p.id SET p.stock=p.stock+t.qty");
    await conn.query("DELETE oi FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.visitor_id='local-smoke-test'");
    for (const table of ['orders', 'appointments', 'leads', 'product_events']) await conn.query(`DELETE FROM ${table} WHERE visitor_id='local-smoke-test'`);
    await conn.query("DELETE FROM reviews WHERE name='Local Smoke Test' AND comment='Temporary smoke test review'");
    await conn.query("DELETE FROM customers WHERE phone='03000000001' AND name='Local Smoke Test'");
    await conn.commit();
  } catch (error) { await conn.rollback(); throw error; }
  finally { conn.release(); await db.end(); }
}
