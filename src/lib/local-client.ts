type Result = { data: any; error: { message: string } | null; count?: number };
type Listener = (event: string, session: any) => void;
const listeners = new Set<Listener>();
async function request(action: string, payload: unknown = {}): Promise<Result> {
  try {
    const response = await fetch('/api/local', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...payload as object }),
    });
    return await response.json();
  } catch { return { data: null, error: { message: 'Local server is unavailable.' } }; }
}
class Query implements PromiseLike<Result> {
  private query: { table: string; operation: string; filters: unknown[][]; orders?: unknown[][]; limit?: number; single?: boolean };
  constructor(table: string) { this.query = { table, operation: 'select', filters: [] }; }
  select(columns = '*', options = {}) { Object.assign(this.query, { columns, ...options }); return this; }
  order(column: string, options: { ascending?: boolean } = {}) { (this.query.orders ??= []).push([column, options.ascending !== false]); return this; }
  limit(limit: number) { this.query.limit = limit; return this; }
  eq(column: string, value: unknown) { this.query.filters.push([column, '=', value]); return this; }
  gte(column: string, value: unknown) { this.query.filters.push([column, '>=', value]); return this; }
  update(values: unknown) { Object.assign(this.query, { operation: 'update', values }); return this; }
  insert(values: unknown) { Object.assign(this.query, { operation: 'insert', values }); return this; }
  upsert(values: unknown) { Object.assign(this.query, { operation: 'upsert', values }); return this; }
  delete() { this.query.operation = 'delete'; return this; }
  maybeSingle() { this.query.single = true; return this; }
  single() { this.query.single = true; return this; }
  then<TResult1 = Result, TResult2 = never>(resolve?: ((value: Result) => TResult1 | PromiseLike<TResult1>) | null, reject?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null): Promise<TResult1 | TResult2> {
    return request('query', { query: this.query }).then(resolve, reject);
  }
}
export const localClient = {
  from: (table: string) => new Query(table),
  rpc: (name: string, args = {}) => request('rpc', { name, args }),
  auth: {
    getUser: async () => { const r = await request('session'); return { ...r, data: { user: r.data?.user ?? null } }; },
    getSession: async () => { const r = await request('session'); return { ...r, data: { session: r.data } }; },
    onAuthStateChange: (listener: Listener) => { listeners.add(listener); return { data: { subscription: { unsubscribe: () => listeners.delete(listener) } } }; },
    signInWithPassword: async (credentials: unknown) => { const r = await request('login', { credentials }); if (!r.error) listeners.forEach(l => l('SIGNED_IN', r.data)); return r; },
    signOut: async () => { const r = await request('logout'); listeners.forEach(l => l('SIGNED_OUT', null)); return r; },
    signUp: async () => ({ data: {}, error: { message: 'Local mode uses the admin account configured in .env.' } }),
    resetPasswordForEmail: async () => ({ error: { message: 'Change ADMIN_PASSWORD in .env and restart the local server.' } }),
    updateUser: async () => ({ error: { message: 'Change ADMIN_PASSWORD in .env and restart the local server.' } }),
  },
  storage: { from: () => ({ upload: async (path: string, file: File) => {
    const data = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1] ?? ''); reader.onerror = reject; reader.readAsDataURL(file); });
    return request('upload', { path, data, contentType: file.type });
  } }) },
};
