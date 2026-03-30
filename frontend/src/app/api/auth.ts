import { apiFetch } from './client';
import { setToken, setUser, clearToken, clearUser, type AuthUser } from './storage';

export async function login(email: string, password: string) {
  const res = await apiFetch<{ token: string; user: AuthUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(res.token);
  setUser(res.user);
  return res.user;
}

export async function logout() {
  clearToken();
  clearUser();
}

export async function me() {
  return apiFetch<AuthUser>('/api/auth/me');
}
