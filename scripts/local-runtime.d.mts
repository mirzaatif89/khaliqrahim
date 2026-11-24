import type { Plugin } from 'vite';
export function localRuntimePlugin(): Plugin;
export function localQuery(query: Record<string, unknown>, admin?: boolean): Promise<{ data: any; error: null; count?: number }>;
