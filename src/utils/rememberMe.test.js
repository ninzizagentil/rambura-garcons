import test from 'node:test';
import assert from 'node:assert/strict';
import { readRememberedIdentifier, persistRememberedIdentifier } from './rememberMe.js';

function makeStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

test('readRememberedIdentifier returns the stored username', () => {
  const storage = makeStorage();
  storage.setItem('rg_remember_identifier', 'director');
  globalThis.localStorage = storage;

  assert.equal(readRememberedIdentifier(), 'director');
});

test('persistRememberedIdentifier stores the identifier when remember is true', () => {
  const storage = makeStorage();
  globalThis.localStorage = storage;

  persistRememberedIdentifier('admin', true);

  assert.equal(readRememberedIdentifier(), 'admin');
});

test('persistRememberedIdentifier removes the identifier when remember is false', () => {
  const storage = makeStorage();
  globalThis.localStorage = storage;
  storage.setItem('rg_remember_identifier', 'director');

  persistRememberedIdentifier('director', false);

  assert.equal(readRememberedIdentifier(), '');
});
