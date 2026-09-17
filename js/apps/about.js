// Profile: bio, avatar, quick stats, and a "currently" widget. All from data/profile.json.

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
  title: 'Profile',
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
          <div class="stat"><b>${esc(p.location || '?')}</b><small>Based in</small></div>
          <div class="stat"><b id="about-time">${localTime(p.timezone)}</b><small>My local time</small></div>
          ${yearsCoding !== null ? `<div class="stat"><b>${yearsCoding}+ years</b><small>Writing code</small></div>` : ''}
        </div>
        <div class="currently">
          <h3>Currently <span class="live-pill" id="about-live" hidden><i></i><span></span></span></h3>
          <ul id="about-current" class="live-list"></ul>
        </div>
      </div>`;

    // "Currently" rows: live Discord data wins, then profile.json, then "nothing"
    const list = root.querySelector('#about-current');
    const pill = root.querySelector('#about-live');
    const manual = p.currently || {};
    const renderCurrent = (pr) => {
      if (pr) {
        const st = STATUS[pr.status] || STATUS.offline;
        pill.hidden = false;
        pill.querySelector('i').style.background = st.color;
        pill.querySelector('span').textContent = st.label;
      }
      const rows = [];
      if (pr?.game) rows.push(`<li class="live-row"><span>🎮</span><div>Playing <b>${esc(pr.game.name)}</b>${pr.game.details ? `<small>${esc(pr.game.details)}${pr.game.state ? ` · ${esc(pr.game.state)}` : ''}</small>` : ''}${pr.game.since ? `<small>For ${elapsed(pr.game.since)}</small>` : ''}</div><span class="live-tag">live</span></li>`);
      else rows.push(`<li><span>🎮</span>Playing <b>${esc(manual.playing || 'nothing')}</b></li>`);
      if (pr?.spotify) rows.push(`<li class="live-row">${pr.spotify.art ? `<img src="${esc(pr.spotify.art)}" alt="" class="live-art">` : '<span>🎧</span>'}<div>Listening to <b>${esc(pr.spotify.song)}</b><small>${esc(pr.spotify.artist)}</small></div><span class="live-tag">live</span></li>`);
      else rows.push(`<li><span>🎧</span>Listening to <b>${esc(manual.listening || 'nothing')}</b></li>`);
      if (pr?.custom?.text) rows.push(`<li class="live-row"><span>${esc(pr.custom.emoji || '💬')}</span><div>${esc(pr.custom.text)}</div><span class="live-tag">status</span></li>`);
      if (manual.building) rows.push(`<li><span>🛠️</span>Building <b>${esc(manual.building)}</b></li>`);
      if (manual.reading) rows.push(`<li><span>📖</span>Reading <b>${esc(manual.reading)}</b></li>`);
      list.innerHTML = rows.join('');
    };
    renderCurrent(presence());
    onLive = (e) => renderCurrent(e.detail);
    live.addEventListener('update', onLive);

    const timeEl = root.querySelector('#about-time');
    timer = setInterval(() => { timeEl.textContent = localTime(p.timezone); }, 15000);
  },

  unmount() {
    clearInterval(timer);
    if (onLive) live.removeEventListener('update', onLive);
    onLive = null;
  },
};
