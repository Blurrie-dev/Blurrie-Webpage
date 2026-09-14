// Start menu: lists every app plus Shut Down.

import { apps, isVisible } from './apps/registry.js';
import { openApp } from './wm.js';
import { sfx } from './sfx.js';
import { esc, onClickOutside } from './ui.js';
import { shutdown } from './gimmicks/shutdown.js';
import { loadData } from './data.js';

export function initStartMenu() {
  const menu = document.getElementById('startmenu');
  const startBtn = document.getElementById('start-btn');
  let cancelOutside = null;

  let profile = { name: 'Hudson' };
  loadData('profile').then((p) => { profile = p; }).catch(() => {});

  const render = () => {
    const items = apps.filter((a) => a.start !== false && isVisible(a));
    const tiles = apps.filter((a) => a.desktop !== false && isVisible(a));
    menu.innerHTML = `
      <div class="startmenu-head">
        <span class="sm-avatar" aria-hidden="true">${profile.avatar ? `<img src="${esc(profile.avatar)}" alt="" onerror="this.replaceWith('🧑‍💻')">` : '🧑‍💻'}</span>
        <span>${esc(profile.name)}</span>
      </div>
      <div class="startmenu-main">
        <ul class="startmenu-list" role="menu">
          ${items.map((a) => `<li role="menuitem" tabindex="0" data-app="${esc(a.id)}"><span class="mi-icon" aria-hidden="true">${esc(a.icon)}</span>${esc(a.title)}</li>`).join('')}
        </ul>
        <div class="startmenu-tiles" role="menu" aria-label="Pinned">
          ${tiles.map((a, i) => `<button role="menuitem" class="tile tile-c${i % 8}" data-app="${esc(a.id)}"><span class="tile-icon" aria-hidden="true">${esc(a.icon)}</span><span class="tile-label">${esc(a.title)}</span></button>`).join('')}
        </div>
      </div>
      <div class="startmenu-foot">
        <button role="menuitem" data-action="shutdown" title="Shut down"><span class="off-icon" aria-hidden="true">⏻</span><span class="foot-label">Turn Off Computer</span></button>
      </div>`;
  };

  const close = () => {
    if (menu.hidden) return;
    menu.hidden = true;
    startBtn.classList.remove('open');
    startBtn.setAttribute('aria-expanded', 'false');
    cancelOutside?.();
    cancelOutside = null;
  };

  const open = () => {
    render();
    menu.hidden = false;
    startBtn.classList.add('open');
    startBtn.setAttribute('aria-expanded', 'true');
    menu.querySelector('[role="menuitem"]')?.focus();
    cancelOutside = onClickOutside(menu, close, { ignore: [startBtn] });
  };

  startBtn.addEventListener('click', () => {
    sfx.play('click');
    menu.hidden ? open() : close();
  });

  const activate = (li) => {
    if (!li) return;
    close();
    if (li.dataset.app) openApp(li.dataset.app);
    else if (li.dataset.action === 'shutdown') shutdown();
  };
  menu.addEventListener('click', (e) => activate(e.target.closest('[role="menuitem"]')));
  menu.addEventListener('keydown', (e) => {
    const items = [...menu.querySelectorAll('[role="menuitem"]')];
    const i = items.indexOf(document.activeElement);
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(items[i]); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length]?.focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length]?.focus(); }
  });

  // Win key / Ctrl+Esc toggles the menu like the real thing
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && e.ctrlKey) { e.preventDefault(); startBtn.click(); }
  });

  return { open, close };
}
