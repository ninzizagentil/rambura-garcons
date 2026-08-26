const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const ACCESS_TOKEN_KEY = 'rg_access_token';
const REFRESH_TOKEN_KEY = 'rg_refresh_token';

export class ApiError extends Error {
  constructor(message, status, errors = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

function token() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setTokens({ accessToken, refreshToken }) {
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

async function request(path, options = {}, retry = true) {
  const headers = new Headers(options.headers || {});
  const isFormData = options.body instanceof FormData;
  if (!isFormData && options.body !== undefined) headers.set('Content-Type', 'application/json');
  const accessToken = token();
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  const response = await fetch(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`, { ...options, headers });
  const body = await response.json().catch(() => ({}));
  if (response.status === 401 && retry) {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      const refreshed = await request('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }, false).catch(() => null);
      if (refreshed?.data?.accessToken) {
        setTokens(refreshed.data);
        return request(path, options, false);
      }
    }
    clearTokens();
    window.dispatchEvent(new Event('rg:session-expired'));
  }
  if (!response.ok || body.success === false) throw new ApiError(body.message || 'Request failed', response.status, body.errors || []);
  return body;
}

function withQuery(path, params = {}) {
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''));
  return query.toString() ? `${path}?${query}` : path;
}

export const api = {
  get: (path, params) => request(withQuery(path, params)),
  post: (path, data) => request(path, { method: 'POST', body: data instanceof FormData ? data : JSON.stringify(data) }),
  put: (path, data) => request(path, { method: 'PUT', body: data instanceof FormData ? data : JSON.stringify(data) }),
  patch: (path, data) => request(path, { method: 'PATCH', body: data instanceof FormData ? data : JSON.stringify(data) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};
