// Loads data/<name>.json once and caches the promise so apps can share it.

const cache = new Map();

export function loadData(name) {
  if (!cache.has(name)) {
    const p = fetch(`data/${name}.json`, { cache: 'no-cache' }).then((res) => {
      if (!res.ok) throw new Error(`data/${name}.json → HTTP ${res.status}`);
      return res.json();
    });
    p.catch(() => cache.delete(name)); // allow a retry after a failure
    cache.set(name, p);
  }
  return cache.get(name);
}
