// Achievements viewer. Locked secret ones show as ??? until earned.

import { ACHIEVEMENTS, unlocked, events } from '../achievements.js';
import { esc } from '../ui.js';

let off = null;

export default {
  id: 'achievements',
  title: 'Achievements',
  icon: '🏅',
  size: { w: 560, h: 480 },
  desktop: false,

  mount(root, ctx) {
    const render = () => {
      const have = new Set(unlocked());
      const n = have.size;
      root.innerHTML = `
        <div class="ach">
          <div class="ach-head">
            <div>
              <h2>${n} / ${ACHIEVEMENTS.length} unlocked</h2>
              <p class="muted">Poke around. Break things. Earn badges nobody asked for.</p>
            </div>
            <div class="ach-bar"><div style="width:${(n / ACHIEVEMENTS.length) * 100}%"></div></div>
          </div>
          <ul class="ach-grid">
            ${ACHIEVEMENTS.map((a) => {
              const got = have.has(a.id);
              const hidden = a.secret && !got;
              return `
                <li class="ach-card ${got ? 'got' : 'locked'}">
                  <span class="ach-icon" aria-hidden="true">${hidden ? '❔' : esc(a.icon)}</span>
                  <b>${hidden ? '???' : esc(a.title)}</b>
                  <small>${hidden ? 'Secret. Try harder.' : esc(a.desc)}</small>
                </li>`;
            }).join('')}
          </ul>
        </div>`;
      ctx.setStatus(n === ACHIEVEMENTS.length ? 'All of them. Go outside.' : `${ACHIEVEMENTS.length - n} to go`);
    };
    render();
    off = render;
    events.addEventListener('unlock', off);
  },

  unmount() {
    if (off) events.removeEventListener('unlock', off);
    off = null;
  },
};
