const viteEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
const API_URL = (viteEnv.VITE_API_URL || '/api').replace(/\/$/, '');
const ACCESS_TOKEN_KEY = 'rg_access_token';
const REFRESH_TOKEN_KEY = 'rg_refresh_token';
let refreshInFlight = null;

// Uploaded images are saved as "/uploads/..." (no server address inside). If the API lives on another
// origin (VITE_API_URL is a full URL) they get that origin here. Older records that saved
// "http://localhost:5000/uploads/..." are repaired the same way, so images survive moving to a real domain.
const UPLOAD_ORIGIN = /^https?:\/\//i.test(API_URL) ? new URL(API_URL).origin : '';
const LEGACY_LOCAL_UPLOAD = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/uploads\//i;
function fixUploadUrl(value) {
  if (value.startsWith('/uploads/')) return UPLOAD_ORIGIN + value;
  if (LEGACY_LOCAL_UPLOAD.test(value)) return UPLOAD_ORIGIN + value.slice(value.indexOf('/uploads/'));
  return value;
}
function normalizeUploadUrls(node) {
  if (typeof node === 'string') return node.length < 600 && (node.startsWith('/uploads/') || node.startsWith('http')) ? fixUploadUrl(node) : node;
  if (Array.isArray(node)) return node.map(normalizeUploadUrls);
  if (node && typeof node === 'object') {
    for (const key of Object.keys(node)) node[key] = normalizeUploadUrls(node[key]);
  }
  return node;
}

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

function expireSession() {
  clearTokens();
  window.dispatchEvent(new Event('rg:session-expired'));
}

async function refreshAccessToken() {
  if (refreshInFlight) return refreshInFlight;
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;

  refreshInFlight = request('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }, false)
    .then((refreshed) => {
      if (!refreshed?.data?.accessToken) return null;
      setTokens({ accessToken: refreshed.data.accessToken, refreshToken });
      return refreshed.data.accessToken;
    })
    .catch(() => null)
    .finally(() => { refreshInFlight = null; });

  return refreshInFlight;
}

async function request(path, options = {}, retry = true) {
  // quiet403: the caller expects a 403 for some roles and handles it itself (no permission re-sync).
  const { quiet403, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers || {});
  const isFormData = options.body instanceof FormData;
  if (!isFormData && options.body !== undefined) headers.set('Content-Type', 'application/json');
  const accessToken = token();
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  const response = await fetch(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`, { ...fetchOptions, headers });
  const body = normalizeUploadUrls(await response.json().catch(() => ({})));

  if (response.status === 401 && retry) {
    const refreshedAccessToken = await refreshAccessToken();
    if (refreshedAccessToken) {
      try {
        return await request(path, options, false);
      } catch (error) {
        if (error.status !== 401) throw error;
      }
    }

    if (accessToken || localStorage.getItem(REFRESH_TOKEN_KEY)) expireSession();
  }

  // The server said this user no longer holds a permission they still see in
  // their menu → ask the auth context to re-sync permissions right now.
  if (response.status === 403 && !quiet403 && /permission/i.test(body.message || '')) {
    window.dispatchEvent(new Event('rg:permissions-changed'));
  }

  if (!response.ok || body.success === false) throw new ApiError(body.message || 'Request failed', response.status, body.errors || []);
  return body;
}

function withQuery(path, params = {}) {
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''));
  return query.toString() ? `${path}?${query}` : path;
}

// Binary downloads (CSV/PDF exports). Same token-refresh behaviour as request(),
// but the response body is returned as a Blob instead of being parsed as JSON.
async function download(path, params) {
  const url = `${API_URL}${withQuery(path.startsWith('/') ? path : `/${path}`, params)}`;
  const send = () => fetch(url, { headers: token() ? { Authorization: `Bearer ${token()}` } : {} });
  let response = await send();
  if (response.status === 401) {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      const refreshed = await request('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }, false).catch(() => null);
      if (refreshed?.data?.accessToken) {
        setTokens({ accessToken: refreshed.data.accessToken, refreshToken });
        response = await send();
      }
    }
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(body.message || 'Download failed', response.status, body.errors || []);
  }
  return response.blob();
}

export const api = {
  download,
  get: (path, params, options) => request(withQuery(path, params), options),
  post: (path, data) => request(path, { method: 'POST', body: data instanceof FormData ? data : JSON.stringify(data) }),
  put: (path, data) => request(path, { method: 'PUT', body: data instanceof FormData ? data : JSON.stringify(data) }),
  patch: (path, data) => request(path, { method: 'PATCH', body: data instanceof FormData ? data : JSON.stringify(data) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};
