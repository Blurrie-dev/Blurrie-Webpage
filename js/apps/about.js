// About Me: bio, avatar, quick stats, and a "currently" widget. All from data/profile.json.

import { loadData } from '../data.js';
import { esc } from '../ui.js';

let timer = null;

function localTime(tz) {
  try {
    return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZone: tz });
  } catch {
    return '—';
  }
}

export default {
  id: 'about',
  title: 'About Me',
  icon: '👤',
  size: { w: 580, h: 470 },

  async mount(root, ctx) {
    root.innerHTML = '<p class="muted">Loading…</p>';
    const p = await loadData('profile');
    const yearsCoding = p.codingSince ? new Date().getFullYear() - p.codingSince : null;

    root.innerHTML = `
      <div class="about">
        <div class="about-avatar" aria-hidden="true">
          ${p.avatar ? `<img src="${esc(p.avatar)}" alt="" onerror="this.replaceWith('🧑‍💻')">` : '🧑‍💻'}
        </div>
        <div>
          <h1>${esc(p.name)}</h1>
          <p class="tagline">${esc(p.tagline)}</p>
          ${(p.bio || []).map((para) => `<p>${esc(para)}</p>`).join('')}
        </div>
        ${(p.roles || []).length ? `
        <div class="roles">
          <h3>What I do</h3>
          <ul>
            ${p.roles.map((r) => `<li><span class="role-icon" aria-hidden="true">${esc(r.icon || '•')}</span><div><b>${esc(r.title)}</b><small>${esc(r.detail || '')}</small></div></li>`).join('')}
          </ul>
        </div>` : ''}
        <div class="about-stats">
          <div class="stat"><b>${esc(p.location || '?')}</b><small>based in</small></div>
          <div class="stat"><b id="about-time">${localTime(p.timezone)}</b><small>my local time</small></div>
          ${yearsCoding !== null ? `<div class="stat"><b>${yearsCoding}+ years</b><small>writing code</small></div>` : ''}
        </div>
        <div class="currently">
          <h3>Currently</h3>
          <ul>
            ${p.currently?.playing ? `<li><span>🎮</span>playing <b>${esc(p.currently.playing)}</b></li>` : ''}
            ${p.currently?.listening ? `<li><span>🎧</span>listening to <b>${esc(p.currently.listening)}</b></li>` : ''}
            ${p.currently?.building ? `<li><span>🛠️</span>building <b>${esc(p.currently.building)}</b></li>` : ''}
            ${p.currently?.reading ? `<li><span>📖</span>reading <b>${esc(p.currently.reading)}</b></li>` : ''}
          </ul>
        </div>
      </div>`;

    const timeEl = root.querySelector('#about-time');
    timer = setInterval(() => { timeEl.textContent = localTime(p.timezone); }, 15000);
    ctx.setStatus(`${esc(p.name)}.exe — hand-edited in data/profile.json`);
  },

  unmount() {
    clearInterval(timer);
  },
};
