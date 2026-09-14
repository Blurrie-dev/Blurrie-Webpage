// Window manager: opens apps in draggable/resizable windows, tracks focus and
// z-order, minimise/maximise/close, and persists open windows per session.
//
// Apps implement: { id, title, icon, size?, mount(root, ctx), unmount?(), navigate?(param) }
// The wm emits CustomEvents on `wm`: 'open', 'close', 'focus', 'change'.

import { store } from './store.js';
import { sfx } from './sfx.js';
import { toast } from './ui.js';
import { getApp } from './apps/registry.js';

export const wm = new EventTarget();

const windows = new Map(); // app id -> window record
let zTop = 10;
let openCount = 0;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const emit = (type, detail = {}) => wm.dispatchEvent(new CustomEvent(type, { detail }));
const areaRect = () => document.getElementById('windows').getBoundingClientRect();

export const isMobile = () => matchMedia('(max-width: 700px)').matches;
export const getWindow = (id) => windows.get(id);
export const listWindows = () => [...windows.values()].sort((a, b) => a.order - b.order);
export const activeWindow = () => [...windows.values()].filter((w) => !w.minimized).sort((a, b) => b.z - a.z)[0] || null;

function applyRect(win) {
  const { x, y, w, h } = win.rect;
  Object.assign(win.el.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
}

// Keep the window reachable: at least 80px of it stays inside the desktop area.
function clampRect(win) {
  const a = areaRect();
  const r = win.rect;
  r.w = clamp(r.w, 220, Math.max(220, a.width));
  r.h = clamp(r.h, 140, Math.max(140, a.height));
  r.x = clamp(r.x, 80 - r.w, Math.max(0, a.width - 80));
  r.y = clamp(r.y, 0, Math.max(0, a.height - 30));
}

let persistTimer;
function persist() {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    store.session.set('windows', listWindows().map((w) => ({
      id: w.id, ...w.rect, z: w.z, minimized: w.minimized, maximized: w.maximized,
    })));
  }, 50);
}

// ---------- public API ----------

export function openApp(id, { restore = null, param = null } = {}) {
  const existing = windows.get(id);
  if (existing) {
    focusWindow(id);
    if (param !== null) existing.app.navigate?.(param);
    return existing;
  }

  const app = getApp(id);
  if (!app) {
    toast(`Cannot find "${id}.exe"`, { icon: '⚠️' });
    sfx.play('error');
    return null;
  }

  const el = document.getElementById('tpl-window').content.firstElementChild.cloneNode(true);
  el.dataset.app = id;
  el.setAttribute('aria-label', app.title);
  el.querySelector('.titlebar-title').textContent = app.title;
  el.querySelector('.titlebar-icon').textContent = app.icon;

  const win = {
    id, app, el,
    body: el.querySelector('.window-body'),
    status: el.querySelector('.statusbar'),
    rect: null, z: 0, order: ++openCount,
    minimized: false, maximized: false,
  };

  // Initial geometry: the app's preferred size, cascaded from the last window.
  const a = areaRect();
  const w = Math.min(app.size?.w ?? 480, a.width - 16);
  const h = Math.min(app.size?.h ?? 360, a.height - 16);
  const step = (windows.size % 8) * 28;
  win.rect = restore
    ? { x: restore.x, y: restore.y, w: restore.w, h: restore.h }
    : { x: Math.max(8, Math.min(40 + step, a.width - w - 8)), y: Math.max(8, Math.min(28 + step, a.height - h - 8)), w, h };
  clampRect(win);
  applyRect(win);
  if (restore?.maximized) { win.maximized = true; el.classList.add('maximized'); }

  document.getElementById('windows').appendChild(el);
  windows.set(id, win);
  wireWindow(win);

  const ctx = {
    win, param,
    openApp,
    close: () => closeWindow(id),
    store, sfx, toast,
    // Update the deep link for this window, e.g. setHash('hudsonos') → #projects/hudsonos
    setHash(sub) { history.replaceState(null, '', sub ? `#${id}/${encodeURIComponent(sub)}` : `#${id}`); },
    setTitle(t) { el.querySelector('.titlebar-title').textContent = t; emit('change', { id }); },
    setStatus(html) { win.status.hidden = !html; win.status.innerHTML = html ?? ''; },
  };

  try {
    const result = app.mount(win.body, ctx);
    if (result?.catch) result.catch((err) => showAppError(win, err));
  } catch (err) {
    showAppError(win, err);
  }

  if (restore?.minimized) {
    win.minimized = true;
    el.classList.add('minimized');
    win.z = restore.z ?? ++zTop;
    el.style.zIndex = win.z;
  } else {
    focusWindow(id);
  }
  sfx.play('open');
  emit('open', { id });
  persist();
  return win;
}

export function focusWindow(id) {
  const win = windows.get(id);
  if (!win) return;
  if (win.minimized) {
    win.minimized = false;
    win.el.classList.remove('minimized');
  }
  win.z = ++zTop;
  win.el.style.zIndex = win.z;
  for (const other of windows.values()) other.el.classList.toggle('active', other === win);
  emit('focus', { id });
  persist();
}

export function minimizeWindow(id) {
  const win = windows.get(id);
  if (!win || win.minimized) return;
  win.minimized = true;
  win.el.classList.add('minimized');
  win.el.classList.remove('active');
  const next = activeWindow();
  if (next) focusWindow(next.id); else emit('focus', { id: null });
  emit('change', { id });
  persist();
}

export function toggleMaximize(id) {
  const win = windows.get(id);
  if (!win) return;
  win.maximized = !win.maximized;
  win.el.classList.toggle('maximized', win.maximized);
  focusWindow(id);
  emit('change', { id });
  persist();
}

export function closeWindow(id) {
  const win = windows.get(id);
  if (!win) return;
  try { win.app.unmount?.(); } catch (err) { console.error(err); }
  win.el.remove();
  windows.delete(id);
  sfx.play('close');
  const next = activeWindow();
  if (next) focusWindow(next.id); else emit('focus', { id: null });
  emit('close', { id });
  persist();
}

export function closeAll() {
  for (const id of [...windows.keys()]) closeWindow(id);
}

// Reopen whatever was open before a refresh (same tab only).
export function restoreWindows() {
  const saved = store.session.get('windows', []);
  for (const s of [...saved].sort((a, b) => a.z - b.z)) {
    if (getApp(s.id)) openApp(s.id, { restore: s });
  }
}

// ---------- internals ----------

function showAppError(win, err) {
  console.error(`[${win.id}]`, err);
  win.body.innerHTML = `<div class="app-error">💥 ${win.app.title} crashed.\n\n${String(err?.stack || err)}</div>`;
}

function wireWindow(win) {
  const { el, id } = win;
  const titlebar = el.querySelector('.titlebar');

  // Any press inside the window brings it to the front.
  el.addEventListener('pointerdown', () => { if (activeWindow() !== win) focusWindow(id); }, true);

  el.querySelector('.titlebar-controls').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    sfx.play('click');
    if (btn.dataset.action === 'close') closeWindow(id);
    else if (btn.dataset.action === 'minimize') minimizeWindow(id);
    else if (btn.dataset.action === 'maximize') toggleMaximize(id);
  });

  titlebar.addEventListener('dblclick', (e) => {
    if (!e.target.closest('button') && !isMobile()) toggleMaximize(id);
  });

  // Drag by the title bar
  titlebar.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('button') || win.maximized || isMobile()) return;
    e.preventDefault();
    const start = { px: e.clientX, py: e.clientY, x: win.rect.x, y: win.rect.y };
    titlebar.setPointerCapture(e.pointerId);
    el.classList.add('dragging');
    const move = (ev) => {
      win.rect.x = start.x + (ev.clientX - start.px);
      win.rect.y = start.y + (ev.clientY - start.py);
      clampRect(win);
      applyRect(win);
    };
    const end = () => {
      titlebar.removeEventListener('pointermove', move);
      titlebar.removeEventListener('pointerup', end);
      titlebar.removeEventListener('pointercancel', end);
      el.classList.remove('dragging');
      persist();
    };
    titlebar.addEventListener('pointermove', move);
    titlebar.addEventListener('pointerup', end);
    titlebar.addEventListener('pointercancel', end);
  });

  // Resize from the bottom-right corner
  const handle = el.querySelector('.resize-handle');
  handle.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || win.maximized || isMobile()) return;
    e.preventDefault();
    const start = { px: e.clientX, py: e.clientY, w: win.rect.w, h: win.rect.h };
    handle.setPointerCapture(e.pointerId);
    el.classList.add('resizing');
    const move = (ev) => {
      win.rect.w = start.w + (ev.clientX - start.px);
      win.rect.h = start.h + (ev.clientY - start.py);
      clampRect(win);
      applyRect(win);
    };
    const end = () => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', end);
      handle.removeEventListener('pointercancel', end);
      el.classList.remove('resizing');
      persist();
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  });
}

// Escape closes the focused window (but not while typing in a field, and not
// when a menu is open — those handle Escape themselves).
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || e.defaultPrevented) return;
  if (e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable]')) return;
  if (!document.getElementById('startmenu').hidden || !document.getElementById('ctxmenu').hidden) return;
  const top = activeWindow();
  if (top) closeWindow(top.id);
});

// Keep windows on screen when the viewport changes (rotation, devtools, etc.)
window.addEventListener('resize', () => {
  for (const win of windows.values()) { clampRect(win); applyRect(win); }
  persist();
});
