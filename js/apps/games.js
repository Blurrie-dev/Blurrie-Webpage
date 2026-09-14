// Games: a Steam-library style view of favourite games from data/games.json.
// Left pane lists the library sorted by hours; right pane shows the selected game.

import { loadData } from '../data.js';
import { esc } from '../ui.js';

const STATUS = {
  playing:   { label: 'Playing now', cls: 'is-playing' },
  completed: { label: 'Completed',   cls: 'is-done' },
  backlog:   { label: 'In the backlog', cls: 'is-backlog' },
  forever:   { label: 'Forever game', cls: 'is-forever' },
};

const stars = (n) => n ? '★'.repeat(n) + '☆'.repeat(5 - n) : 'unrated';
const fmtHours = (h) => h >= 1000 ? `${(h / 1000).toFixed(1)}k` : String(h);

export default {
  id: 'games',
  title: 'Games',
  icon: '🕹️',
  size: { w: 680, h: 480 },

  async mount(root, ctx) {
    root.classList.add('no-pad');
    root.innerHTML = '<p class="muted" style="padding:12px">Loading library…</p>';
    const [games, profile] = await Promise.all([loadData('games'), loadData('profile')]);
    const sorted = games.slice().sort((a, b) => (b.hours || 0) - (a.hours || 0));
    const total = sorted.reduce((s, g) => s + (g.hours || 0), 0);
    const steam = (profile.socials || []).find((s) => s.id === 'steam');

    root.innerHTML = `
      <div class="steam">
        <div class="steam-bar">
          <span class="steam-logo" aria-hidden="true">♨</span>
          <b>LIBRARY</b>
          <span class="steam-stat">${sorted.length} games · ${total.toLocaleString()} hrs on record</span>
          ${steam ? `<a class="steam-link" href="${esc(steam.url)}" target="_blank" rel="noopener noreferrer">View Steam profile ↗</a>` : ''}
        </div>
        <div class="steam-body">
          <ul class="steam-list" role="listbox" aria-label="Games">
            ${sorted.map((g, i) => `
              <li role="option" tabindex="0" data-i="${i}" class="${i === 0 ? 'selected' : ''}">
                <span class="steam-li-icon" aria-hidden="true">${esc(g.icon || '🎮')}</span>
                <span class="steam-li-title">${esc(g.title)}</span>
                <span class="steam-li-hours">${fmtHours(g.hours || 0)}h</span>
              </li>`).join('')}
          </ul>
          <section class="steam-detail" id="steam-detail"></section>
        </div>
      </div>`;

    const list = root.querySelector('.steam-list');
    const detail = root.querySelector('#steam-detail');

    const show = (i) => {
      const g = sorted[i];
      const st = STATUS[g.status] || { label: g.status || '', cls: '' };
      list.querySelectorAll('li').forEach((li) => li.classList.toggle('selected', +li.dataset.i === i));
      detail.innerHTML = `
        <div class="steam-hero">
          <span class="steam-hero-icon" aria-hidden="true">${esc(g.icon || '🎮')}</span>
          <div>
            <h2>${esc(g.title)}</h2>
            <div class="steam-tags">${(g.genre || []).map((t) => `<span>${esc(t)}</span>`).join('')}</div>
          </div>
        </div>
        <dl class="steam-facts">
          <dt>Time played</dt><dd><b>${(g.hours || 0).toLocaleString()}</b> hrs</dd>
          <dt>Status</dt><dd><span class="steam-status ${st.cls}">${esc(st.label)}</span></dd>
          <dt>My rating</dt><dd class="steam-stars" title="${g.rating || 0} / 5">${stars(g.rating || 0)}</dd>
          ${g.year ? `<dt>Released</dt><dd>${g.year}</dd>` : ''}
        </dl>
        ${g.take ? `<blockquote class="steam-take">“${esc(g.take)}”</blockquote>` : ''}
        ${g.url ? `<a class="btn" href="${esc(g.url)}" target="_blank" rel="noopener noreferrer">Store page ↗</a>` : ''}`;
      ctx.setStatus(`${esc(g.title)} — ${(g.hours || 0).toLocaleString()} hours. ${total ? Math.round((g.hours || 0) / total * 100) : 0}% of my total.`);
    };

    list.addEventListener('click', (e) => {
      const li = e.target.closest('li[data-i]');
      if (li) { ctx.sfx.play('click'); show(+li.dataset.i); }
    });
    list.addEventListener('keydown', (e) => {
      const li = e.target.closest('li[data-i]');
      if (!li) return;
      const i = +li.dataset.i;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(i); }
      if (e.key === 'ArrowDown') { e.preventDefault(); list.querySelector(`[data-i="${i + 1}"]`)?.focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); list.querySelector(`[data-i="${i - 1}"]`)?.focus(); }
    });

    if (sorted.length) show(0);
  },
};
