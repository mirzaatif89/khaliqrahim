import type { Plugin } from 'vite';
export function localRuntimePlugin(): Plugin;
export function localMiddleware(req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse, next: () => void): Promise<void>;
export function localQuery(query: Record<string, unknown>, admin?: boolean): Promise<{ data: any; error: null; count?: number }>;
