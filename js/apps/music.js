// Music: a Winamp-shaped playlist whose "LCD" is Spotify's official embed, so
// tracks really play (30-second previews, full songs for logged-in visitors).
// Track IDs live in data/music.json → spotify.

import { loadData } from '../data.js';
import { esc } from '../ui.js';

export default {
  id: 'music',
  title: 'Music',
  icon: '🎵',
  size: { w: 440, h: 460 },

  async mount(root, ctx) {
    root.classList.add('no-pad');
    root.innerHTML = '<p class="muted" style="padding:12px">Loading…</p>';
    const tracks = await loadData('music');

    root.innerHTML = `
      <div class="winamp">
        <div class="wa-main">
          <iframe class="wa-embed" id="wa-embed" title="Spotify player" loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>
        </div>
        <div class="wa-playlist">
          <div class="wa-pl-head mono">PLAYLIST · ${tracks.length} tracks</div>
          <ol class="wa-pl" id="wa-pl">
            ${tracks.map((t, i) => `
              <li data-i="${i}" tabindex="0">
                <span class="wa-pl-num mono">${String(i + 1).padStart(2, '0')}.</span>
                <span class="wa-pl-title">${esc(t.artist)} — ${esc(t.title)}</span>
                <span class="wa-pl-year mono">${t.year || ''}</span>
              </li>`).join('')}
          </ol>
        </div>
      </div>`;

    const frame = root.querySelector('#wa-embed');
    const pl = root.querySelector('#wa-pl');

    const select = (i) => {
      const t = tracks[i];
      frame.src = `https://open.spotify.com/embed/track/${encodeURIComponent(t.spotify)}?utm_source=generator&theme=0`;
      pl.querySelectorAll('li').forEach((li) => li.classList.toggle('current', +li.dataset.i === i));
    };

    pl.addEventListener('click', (e) => {
      const li = e.target.closest('li[data-i]');
      if (li) { ctx.sfx.play('click'); select(+li.dataset.i); }
    });
    pl.addEventListener('keydown', (e) => {
      const li = e.target.closest('li[data-i]');
      if (li && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); select(+li.dataset.i); }
    });

    if (tracks.length) select(0);
  },
};
