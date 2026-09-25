export const REMEMBER_KEY = 'rg_remember_identifier';

export function readRememberedIdentifier() {
  try {
    return globalThis.localStorage.getItem(REMEMBER_KEY) || '';
  } catch {
    return '';
  }
}

export function persistRememberedIdentifier(id, remember) {
  try {
    if (remember && id) {
      globalThis.localStorage.setItem(REMEMBER_KEY, id);
      return;
    }
    globalThis.localStorage.removeItem(REMEMBER_KEY);
  } catch {
    // no-op when storage is unavailable
  }
}
