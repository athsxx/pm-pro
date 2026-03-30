import { Capacitor } from '@capacitor/core';
import { getToken } from './storage';

/** Android emulator → host machine (not localhost, which is the emulator itself). */
const DEFAULT_API_BASE = 'http://10.0.2.2:3001';

export function getApiBase() {
  // Vite env convention
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const envBase = (import.meta as any).env?.VITE_API_BASE as string | undefined;
  let base = (envBase || DEFAULT_API_BASE).replace(/\/$/, '');
  // If the app was built for desktop with localhost, rewrite for Capacitor so login reaches the host.
  if (Capacitor.isNativePlatform()) {
    try {
      const u = new URL(base);
      if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
        u.hostname = '10.0.2.2';
        base = u.toString().replace(/\/$/, '');
      }
    } catch {
      /* ignore invalid URL */
    }
  }
  return base;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const base = getApiBase();
  const url = `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  const token = getToken();

  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(url, { ...init, headers });
  } catch (e) {
    const hint = Capacitor.isNativePlatform()
      ? ' Start the backend on your Mac; emulator must use http://10.0.2.2:PORT (not localhost).'
      : ' Start the backend and set VITE_API_BASE if it is not on localhost.';
    const msg = e instanceof Error ? e.message : 'Network error';
    throw new ApiError(`${msg} — trying ${base}.${hint}`, 0);
  }

  const text = await res.text();
  let data: { error?: string } | null = null;
  if (text) {
    try {
      data = JSON.parse(text) as { error?: string };
    } catch {
      throw new ApiError(
        `Not JSON from ${url} (wrong API or proxy?). First bytes: ${text.slice(0, 60)}…`,
        res.status
      );
    }
  }
  if (!res.ok) {
    const message = data?.error || res.statusText || 'Request failed';
    throw new ApiError(message, res.status);
  }
  return data as T;
}

/** Multipart upload (do not set Content-Type; browser sets boundary). */
export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const base = getApiBase();
  const url = `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  const token = getToken();
  const headers = new Headers();
  headers.set('Accept', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  let res: Response;
  try {
    res = await fetch(url, { method: 'POST', body: formData, headers });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Network error';
    throw new ApiError(`${msg} — trying ${base}`, 0);
  }
  const text = await res.text();
  let data: { error?: string } | null = null;
  if (text) {
    try {
      data = JSON.parse(text) as { error?: string };
    } catch {
      throw new ApiError('Invalid JSON from server', res.status);
    }
  }
  if (!res.ok) {
    const message = data?.error || res.statusText || 'Request failed';
    throw new ApiError(message, res.status);
  }
  return data as T;
}
