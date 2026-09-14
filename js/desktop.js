// Desktop icons, selection, and the right-click context menu.

import { apps } from './apps/registry.js';
import { openApp, closeAll } from './wm.js';
import { cycleTheme } from './theme.js';
import { sfx } from './sfx.js';
import { esc, toast, onClickOutside, isCoarsePointer } from './ui.js';

export function initDesktop() {
  const desktop = document.getElementById('desktop');
  const iconsEl = document.getElementById('icons');

  const renderIcons = () => {
    iconsEl.innerHTML = apps.filter((a) => a.desktop !== false).map((a) => `
      <button class="icon" role="listitem" data-app="${esc(a.id)}" title="${esc(a.title)}">
        <span class="icon-img" aria-hidden="true">${esc(a.icon)}</span>
        <span class="icon-label">${esc(a.title)}</span>
      </button>`).join('');
  };
  renderIcons();

  const select = (btn) => {
    iconsEl.querySelectorAll('.icon.selected').forEach((i) => i.classList.remove('selected'));
    btn?.classList.add('selected');
  };

  iconsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.icon');
    if (!btn) return;
    select(btn);
    if (isCoarsePointer()) openApp(btn.dataset.app); // touch: single tap opens
  });
  iconsEl.addEventListener('dblclick', (e) => {
    const btn = e.target.closest('.icon');
    if (btn) openApp(btn.dataset.app);
  });
  iconsEl.addEventListener('keydown', (e) => {
    const btn = e.target.closest('.icon');
    if (btn && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openApp(btn.dataset.app); }
  });

  // Click on empty desktop clears selection
  desktop.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('.icon') && !e.target.closest('.window')) select(null);
  });

  // ---- Context menu ----
  const ctx = document.getElementById('ctxmenu');
  let cancelOutside = null;
  const closeCtx = () => { ctx.hidden = true; cancelOutside?.(); cancelOutside = null; };

  const MENU = [
    { label: 'Arrange icons', icon: '⊞', run: () => { renderIcons(); toast('Icons arranged. They were already arranged.', { icon: '⊞' }); } },
    { label: 'Switch theme', icon: '🎨', run: () => { const t = cycleTheme(); toast(`Theme: ${t.name}`, { icon: '🎨' }); } },
    { label: 'Close all windows', icon: '🧹', run: () => closeAll() },
    { sep: true },
    { label: 'Settings', icon: '⚙️', run: () => openApp('settings') },
    { label: 'About HudsonOS', icon: '💾', run: () => openApp('sysinfo') },
  ];

  desktop.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.window')) return; // apps keep the native menu
    e.preventDefault();
    closeCtx();
    ctx.innerHTML = MENU.map((m, i) => m.sep
      ? '<div class="sep" role="separator"></div>'
      : `<button role="menuitem" data-i="${i}"><span aria-hidden="true">${esc(m.icon)}</span>${esc(m.label)}</button>`).join('');
    ctx.hidden = false;
    const { offsetWidth: w, offsetHeight: h } = ctx;
    ctx.style.left = `${Math.min(e.clientX, innerWidth - w - 4)}px`;
    ctx.style.top = `${Math.min(e.clientY, innerHeight - h - 4)}px`;
    cancelOutside = onClickOutside(ctx, closeCtx);
  });
  ctx.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-i]');
    if (!btn) return;
    sfx.play('click');
    closeCtx();
    MENU[btn.dataset.i].run();
  });
}
