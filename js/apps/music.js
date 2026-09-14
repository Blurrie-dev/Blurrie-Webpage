// Music: a Winamp-shaped player. It doesn't actually play audio — the LCD shows
// the selected album, the visualiser dances, and Play opens the streaming link.

import { loadData } from '../data.js';
import { esc } from '../ui.js';

const BARS = 18;
let timer = null;

export default {
  id: 'music',
  title: 'Music',
  icon: '🎵',
  size: { w: 440, h: 460 },

  async mount(root, ctx) {
    root.classList.add('no-pad');
    root.innerHTML = '<p class="muted" style="padding:12px">Loading…</p>';
    const tracks = await loadData('music');
    let idx = 0;
    let playing = false;
    let seek = 0;

    root.innerHTML = `
      <div class="winamp">
        <div class="wa-main">
          <div class="wa-lcd">
            <div class="wa-time mono" id="wa-time">00:00</div>
            <div class="wa-vis" id="wa-vis" aria-hidden="true">${'<i></i>'.repeat(BARS)}</div>
            <div class="wa-marquee"><span id="wa-title"></span></div>
            <div class="wa-meta mono"><span id="wa-kbps">192 kbps</span><span>44 kHz</span><span>stereo</span></div>
          </div>
          <div class="wa-seek"><div class="wa-seek-fill" id="wa-seek"></div></div>
          <div class="wa-transport">
            <button class="wa-btn" data-act="prev" title="Previous" aria-label="Previous">⏮</button>
            <button class="wa-btn" data-act="play" title="Play (opens the album)" aria-label="Play">▶</button>
            <button class="wa-btn" data-act="pause" title="Pause" aria-label="Pause">⏸</button>
            <button class="wa-btn" data-act="stop" title="Stop" aria-label="Stop">⏹</button>
            <button class="wa-btn" data-act="next" title="Next" aria-label="Next">⏭</button>
            <button class="wa-btn wa-shuffle" data-act="shuffle" title="Shuffle" aria-label="Shuffle">🔀</button>
          </div>
        </div>
        <div class="wa-playlist">
          <div class="wa-pl-head mono">PLAYLIST · ${tracks.length} albums</div>
          <ol class="wa-pl" id="wa-pl">
            ${tracks.map((t, i) => `
              <li data-i="${i}" tabindex="0">
                <span class="wa-pl-num mono">${String(i + 1).padStart(2, '0')}.</span>
                <span class="wa-pl-title">${esc(t.artist)} — ${esc(t.title)}</span>
                <span class="wa-pl-year mono">${t.year || ''}</span>
              </li>`).join('')}
          </ol>
        </div>
        <p class="wa-note" id="wa-note"></p>
      </div>`;

    const titleEl = root.querySelector('#wa-title');
    const noteEl = root.querySelector('#wa-note');
    const timeEl = root.querySelector('#wa-time');
    const seekEl = root.querySelector('#wa-seek');
    const vis = root.querySelector('#wa-vis');
    const pl = root.querySelector('#wa-pl');

    const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    const select = (i) => {
      idx = (i + tracks.length) % tracks.length;
      const t = tracks[idx];
      titleEl.textContent = `${idx + 1}. ${t.artist} — ${t.title}${t.year ? ` (${t.year})` : ''}   ***   `;
      noteEl.textContent = t.note || '';
      pl.querySelectorAll('li').forEach((li) => li.classList.toggle('current', +li.dataset.i === idx));
      seek = 0;
      timeEl.textContent = fmt(0);
      seekEl.style.width = '0%';
      ctx.setStatus(playing ? `Playing: ${esc(t.artist)} — ${esc(t.title)}` : 'Stopped. Pick an album.');
    };

    const setPlaying = (on) => {
      playing = on;
      vis.classList.toggle('on', on);
      root.querySelector('.winamp').classList.toggle('playing', on);
      ctx.setStatus(on ? `Playing: ${esc(tracks[idx].artist)} — ${esc(tracks[idx].title)}` : 'Paused.');
    };

    // Fake progress: counts up while "playing", loops to the next album at 3:00
    clearInterval(timer);
    timer = setInterval(() => {
      if (!playing) return;
      seek++;
      timeEl.textContent = fmt(seek);
      seekEl.style.width = `${Math.min(100, seek / 180 * 100)}%`;
      if (seek >= 180) select(idx + 1);
    }, 1000);

    root.querySelector('.wa-transport').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      ctx.sfx.play('click');
      const act = btn.dataset.act;
      if (act === 'prev') select(idx - 1);
      else if (act === 'next') select(idx + 1);
      else if (act === 'shuffle') select(Math.floor(Math.random() * tracks.length));
      else if (act === 'pause') setPlaying(false);
      else if (act === 'stop') { setPlaying(false); seek = 0; timeEl.textContent = fmt(0); seekEl.style.width = '0%'; }
      else if (act === 'play') {
        setPlaying(true);
        const t = tracks[idx];
        if (t.url) {
          window.open(t.url, '_blank', 'noopener');
          ctx.toast(`Opening ${t.artist} — ${t.title}`, { icon: '🎵' });
        }
      }
    });

    pl.addEventListener('click', (e) => {
      const li = e.target.closest('li[data-i]');
      if (li) { ctx.sfx.play('click'); select(+li.dataset.i); }
    });
    pl.addEventListener('dblclick', (e) => {
      const li = e.target.closest('li[data-i]');
      if (li) { select(+li.dataset.i); root.querySelector('[data-act="play"]').click(); }
    });
    pl.addEventListener('keydown', (e) => {
      const li = e.target.closest('li[data-i]');
      if (li && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); select(+li.dataset.i); }
    });

    if (tracks.length) select(0);
  },

  unmount() {
    clearInterval(timer);
    timer = null;
  },
};
