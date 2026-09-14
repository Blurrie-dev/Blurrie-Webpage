// Hash routing: #projects opens Projects; focusing a window updates the hash,
// so any window can be deep-linked.

import { wm, openApp } from './wm.js';
import { getApp } from './apps/registry.js';

export function initRouter() {
  const openFromHash = () => {
    const [id, ...rest] = decodeURIComponent(location.hash.slice(1)).split('/');
    if (id && getApp(id)) openApp(id, { param: rest.join('/') || null });
  };

  window.addEventListener('hashchange', openFromHash);

  // Keep the hash pointing at the focused app, but leave an app's own sub-path alone.
  wm.addEventListener('focus', (e) => {
    const id = e.detail.id;
    const current = location.hash.slice(1).split('/')[0];
    if (current === id) return;
    history.replaceState(null, '', id ? `#${id}` : location.pathname + location.search);
  });

  return openFromHash;
}
