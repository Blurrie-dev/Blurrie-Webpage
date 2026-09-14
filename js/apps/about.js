// About Me: bio, avatar, quick stats, and a "currently" widget. All from data/profile.json.

import { loadData } from '../data.js';
import { esc } from '../ui.js';
import { live, presence, STATUS, elapsed } from '../live.js';

let timer = null;
let onLive = null;

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
          <h3>Currently <span class="live-pill" id="about-live" hidden><i></i><span></span></span></h3>
          <ul id="about-live-list" class="live-list"></ul>
          <ul>
            ${p.currently?.playing ? `<li><span>🎮</span>playing <b>${esc(p.currently.playing)}</b></li>` : ''}
            ${p.currently?.listening ? `<li><span>🎧</span>listening to <b>${esc(p.currently.listening)}</b></li>` : ''}
            ${p.currently?.building ? `<li><span>🛠️</span>building <b>${esc(p.currently.building)}</b></li>` : ''}
            ${p.currently?.reading ? `<li><span>📖</span>reading <b>${esc(p.currently.reading)}</b></li>` : ''}
          </ul>
        </div>
      </div>`;

    // Live rows from Discord (Lanyard) sit above the hand-edited ones
    const liveList = root.querySelector('#about-live-list');
    const pill = root.querySelector('#about-live');
    const renderLive = (pr) => {
      if (!pr) return;
      const st = STATUS[pr.status] || STATUS.offline;
      pill.hidden = false;
      pill.querySelector('i').style.background = st.color;
      pill.querySelector('span').textContent = st.label;
      const rows = [];
      if (pr.spotify) rows.push(`<li class="live-row">${pr.spotify.art ? `<img src="${esc(pr.spotify.art)}" alt="" class="live-art">` : '<span>🎧</span>'}<div>listening to <b>${esc(pr.spotify.song)}</b><small>${esc(pr.spotify.artist)}</small></div><span class="live-tag">live</span></li>`);
      if (pr.game) rows.push(`<li class="live-row"><span>🎮</span><div>playing <b>${esc(pr.game.name)}</b>${pr.game.details ? `<small>${esc(pr.game.details)}${pr.game.state ? ` · ${esc(pr.game.state)}` : ''}</small>` : ''}${pr.game.since ? `<small>for ${elapsed(pr.game.since)}</small>` : ''}</div><span class="live-tag">live</span></li>`);
      if (pr.custom?.text) rows.push(`<li class="live-row"><span>${esc(pr.custom.emoji || '💬')}</span><div>${esc(pr.custom.text)}</div><span class="live-tag">status</span></li>`);
      liveList.innerHTML = rows.join('');
    };
    renderLive(presence());
    onLive = (e) => renderLive(e.detail);
    live.addEventListener('update', onLive);

    const timeEl = root.querySelector('#about-time');
    timer = setInterval(() => { timeEl.textContent = localTime(p.timezone); }, 15000);
    ctx.setStatus(`${esc(p.name)}.exe — hand-edited in data/profile.json`);
  },

  unmount() {
    clearInterval(timer);
    if (onLive) live.removeEventListener('update', onLive);
    onLive = null;
  },
};
