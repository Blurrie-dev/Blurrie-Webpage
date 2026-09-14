// Taskbar: Start button, one button per open window, system tray, clock.

import { wm, listWindows, activeWindow, focusWindow, minimizeWindow } from './wm.js';
import { cycleTheme, THEMES, currentTheme, themeEvents } from './theme.js';
import { sfx } from './sfx.js';
import { toast, esc } from './ui.js';

const THEME_ICON = { luna: '🌄', classic: '🎨', midnight: '🌙' };

export function initTaskbar() {
  const bar = document.getElementById('taskbar');
  bar.innerHTML = `
    <button class="start-btn" id="start-btn" aria-haspopup="menu" aria-expanded="false">
      <span class="start-logo" aria-hidden="true"><i></i><i></i><i></i><i></i></span>Start
    </button>
    <div class="taskbar-sep"></div>
    <div class="tasks" id="tasks" role="list"></div>
    <div class="tray">
      <button class="tray-btn" id="tray-theme" title="Switch theme"></button>
      <button class="tray-btn" id="tray-sound" title="Toggle sounds"></button>
      <span class="status-dot" id="tray-status" title="Discord status (coming in Phase 5)"></span>
      <span class="clock" id="clock"></span>
    </div>`;

  const tasks = bar.querySelector('#tasks');
  const renderTasks = () => {
    const active = activeWindow();
    tasks.innerHTML = listWindows().map((w) => `
      <button class="task-btn${w === active ? ' active' : ''}" data-id="${esc(w.id)}" role="listitem" title="${esc(w.app.title)}">
        <i aria-hidden="true">${esc(w.app.icon)}</i><span>${esc(w.el.querySelector('.titlebar-title').textContent)}</span>
      </button>`).join('');
  };
  tasks.addEventListener('click', (e) => {
    const btn = e.target.closest('.task-btn');
    if (!btn) return;
    sfx.play('click');
    if (btn.classList.contains('active')) minimizeWindow(btn.dataset.id);
    else focusWindow(btn.dataset.id);
  });
  ['open', 'close', 'focus', 'change'].forEach((t) => wm.addEventListener(t, renderTasks));
  renderTasks();

  // Tray: theme
  const themeBtn = bar.querySelector('#tray-theme');
  const renderTheme = () => {
    const t = THEMES.find((x) => x.id === currentTheme());
    themeBtn.textContent = THEME_ICON[t.id] ?? '🎨';
    themeBtn.title = `Theme: ${t.name} (click to switch)`;
  };
  themeBtn.addEventListener('click', () => {
    const next = cycleTheme();
    sfx.play('click');
    toast(`Theme: ${next.name}`, { icon: THEME_ICON[next.id] });
  });
  themeEvents.addEventListener('change', renderTheme);
  renderTheme();

  // Tray: sound
  const soundBtn = bar.querySelector('#tray-sound');
  const renderSound = () => {
    soundBtn.textContent = sfx.enabled() ? '🔊' : '🔇';
    soundBtn.title = sfx.enabled() ? 'Sounds on (click to mute)' : 'Sounds off (click to enable)';
  };
  soundBtn.addEventListener('click', () => {
    sfx.setEnabled(!sfx.enabled());
    renderSound();
    sfx.play('startup');
  });
  document.addEventListener('hudsonos:soundchange', renderSound);
  renderSound();

  // Clock
  const clock = bar.querySelector('#clock');
  const tick = () => {
    const now = new Date();
    clock.textContent = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    clock.title = now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };
  tick();
  setInterval(tick, 1000);
}
