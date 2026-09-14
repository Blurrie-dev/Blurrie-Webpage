// Small shared UI helpers: toasts, HTML escaping, click-outside.

import { sfx } from './sfx.js';

export function esc(str) {
  return String(str ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

export function toast(message, { icon = 'ℹ️', duration = 3500 } = {}) {
  const host = document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span class="toast-icon" aria-hidden="true">${esc(icon)}</span><span>${esc(message)}</span>`;
  host.appendChild(el);
  sfx.play('toast');
  setTimeout(() => {
    el.classList.add('leaving');
    setTimeout(() => el.remove(), 320);
  }, duration);
  return el;
}

// Calls `onOutside` the next time the user presses outside `el` (or hits Escape).
// Returns a function that cancels the listener.
export function onClickOutside(el, onOutside, { ignore = [] } = {}) {
  const down = (e) => {
    if (el.contains(e.target) || ignore.some((i) => i && i.contains(e.target))) return;
    cancel();
    onOutside();
  };
  const key = (e) => { if (e.key === 'Escape') { cancel(); onOutside(); } };
  const cancel = () => {
    document.removeEventListener('pointerdown', down, true);
    document.removeEventListener('keydown', key, true);
  };
  // Defer so the click that opened the element doesn't immediately close it.
  setTimeout(() => {
    document.addEventListener('pointerdown', down, true);
    document.addEventListener('keydown', key, true);
  });
  return cancel;
}

export const isCoarsePointer = () => matchMedia('(pointer: coarse)').matches;
