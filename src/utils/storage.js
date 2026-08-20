/**
 * Small localStorage wrapper used by the mock service layer.
 * Falls back gracefully if localStorage is unavailable (e.g. SSR/tests).
 */
export function loadCollection(key, seed) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
    localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  } catch {
    return seed;
  }
}

export function saveCollection(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // demo persistence only — ignore quota/availability errors
  }
}

export function genId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}
