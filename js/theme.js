// Theme switching. Themes are defined in css/themes.css as [data-theme] blocks.

import { store } from './store.js';

export const THEMES = [
  { id: 'fluent',   name: 'Fluent',   desc: 'Windows 10. Dark taskbar, flat windows, tiles.' },
  { id: 'luna',     name: 'Luna',     desc: 'Windows XP. Bliss, blue, and a green start button.' },
  { id: 'classic',  name: 'Classic',  desc: 'Beige, bevels, teal. 1995 called.' },
  { id: 'midnight', name: 'Midnight', desc: 'Dark mode with neon accents.' },
];

export const themeEvents = new EventTarget();

export const currentTheme = () => document.documentElement.dataset.theme || 'classic';

export function applyTheme(id) {
  if (!THEMES.some((t) => t.id === id)) id = 'fluent';
  document.documentElement.dataset.theme = id;
  store.set('theme', id);
  themeEvents.dispatchEvent(new CustomEvent('change', { detail: { id } }));
}

export function cycleTheme() {
  const i = THEMES.findIndex((t) => t.id === currentTheme());
  const next = THEMES[(i + 1) % THEMES.length];
  applyTheme(next.id);
  return next;
}

export function initTheme() {
  applyTheme(store.get('theme', 'fluent'));
}
