// Tiny wrappers around localStorage (persistent) and sessionStorage (per-tab).
// Everything is namespaced and JSON-encoded; failures (private mode, quota) are swallowed.

const PREFIX = 'hudsonos:';

function wrap(storage) {
  return {
    get(key, fallback = null) {
      try {
        const raw = storage.getItem(PREFIX + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try { storage.setItem(PREFIX + key, JSON.stringify(value)); } catch { /* ignore */ }
    },
    remove(key) {
      try { storage.removeItem(PREFIX + key); } catch { /* ignore */ }
    },
    clear() {
      try {
        Object.keys(storage)
          .filter((k) => k.startsWith(PREFIX))
          .forEach((k) => storage.removeItem(k));
      } catch { /* ignore */ }
    },
  };
}

export const store = Object.assign(wrap(localStorage), { session: wrap(sessionStorage) });
