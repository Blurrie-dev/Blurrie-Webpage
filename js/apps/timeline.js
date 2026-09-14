// My Story: a git-log style timeline from data/timeline.json, with a year
// scrubber to "travel" through time and expandable entries.

import { loadData } from '../data.js';
import { esc } from '../ui.js';

const TYPE = {
  education: { label: 'education', color: '#8e44ad' },
  work:      { label: 'work',      color: '#d35400' },
  code:      { label: 'code',      color: '#2980b9' },
  life:      { label: 'life',      color: '#27ae60' },
};

export default {
  id: 'timeline',
  title: 'My Story',
  icon: '🗺️',
  size: { w: 600, h: 520 },

  async mount(root, ctx) {
    root.classList.add('no-pad');
    root.innerHTML = '<p class="muted" style="padding:12px">Loading…</p>';
    const entries = (await loadData('timeline')).slice().sort((a, b) => a.year - b.year);
    const years = [...new Set(entries.map((e) => e.year))];
    const minYear = years[0];
    const maxYear = years[years.length - 1];

    root.innerHTML = `
      <div class="tl">
        <div class="tl-scrub">
          <span class="mono" id="tl-min">${minYear}</span>
          <input type="range" id="tl-range" min="${minYear}" max="${maxYear}" value="${maxYear}" step="1" aria-label="Travel to year">
          <span class="mono" id="tl-max">${maxYear}</span>
          <b class="tl-year" id="tl-year">${maxYear}</b>
        </div>
        <ol class="tl-log" id="tl-log">
          ${entries.map((e, i) => {
            const t = TYPE[e.type] || TYPE.life;
            return `
            <li class="tl-entry" data-year="${e.year}" data-i="${i}">
              <span class="tl-dot" style="--dot:${t.color}" aria-hidden="true">${esc(e.icon || '•')}</span>
              <button class="tl-head" aria-expanded="false">
                <span class="tl-when mono">${e.year}${e.month ? ` · ${esc(e.month)}` : ''}</span>
                <span class="tl-title">${esc(e.title)}</span>
                <span class="tl-tag" style="--dot:${t.color}">${t.label}</span>
              </button>
              <div class="tl-body" hidden>
                <p>${esc(e.text || '')}</p>
                ${e.image ? `<img src="${esc(e.image)}" alt="" loading="lazy">` : ''}
                ${e.link ? (e.link.app
                  ? `<button class="btn tl-link" data-app="${esc(e.link.app)}" data-param="${esc(e.link.param || '')}">${esc(e.link.label)} →</button>`
                  : `<a class="btn" href="${esc(e.link.url)}" target="_blank" rel="noopener noreferrer">${esc(e.link.label)} ↗</a>`) : ''}
              </div>
            </li>`;
          }).join('')}
          <li class="tl-entry tl-now">
            <span class="tl-dot" style="--dot:#7f8c8d" aria-hidden="true">✨</span>
            <div class="tl-head tl-head-static"><span class="tl-when mono">now</span><span class="tl-title">you, reading this</span></div>
          </li>
        </ol>
      </div>`;

    const log = root.querySelector('#tl-log');
    const range = root.querySelector('#tl-range');
    const yearLabel = root.querySelector('#tl-year');

    const toggle = (li, open) => {
      const head = li.querySelector('.tl-head');
      const body = li.querySelector('.tl-body');
      if (!body) return;
      const willOpen = open ?? body.hidden;
      body.hidden = !willOpen;
      head.setAttribute('aria-expanded', String(willOpen));
      li.classList.toggle('open', willOpen);
    };

    // Scrubbing: highlight and scroll to the first entry of that year (or the nearest earlier one)
    const goToYear = (y) => {
      yearLabel.textContent = y;
      const items = [...log.querySelectorAll('.tl-entry[data-year]')];
      let target = null;
      for (const li of items) if (+li.dataset.year <= y) target = li;
      items.forEach((li) => li.classList.toggle('current', li === target || (target && li.dataset.year === target.dataset.year)));
      target?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      ctx.setStatus(`${entries.filter((e) => e.year <= y).length} of ${entries.length} milestones by ${y}`);
    };
    range.addEventListener('input', () => goToYear(+range.value));

    log.addEventListener('click', (e) => {
      const link = e.target.closest('.tl-link');
      if (link) { ctx.openApp(link.dataset.app, { param: link.dataset.param || null }); return; }
      const head = e.target.closest('.tl-head[aria-expanded]');
      if (head) {
        const li = head.closest('.tl-entry');
        toggle(li);
        range.value = li.dataset.year;
        goToYear(+li.dataset.year);
        ctx.sfx.play('click');
      }
    });

    // Open the latest entry by default so the window isn't a wall of collapsed rows
    const last = [...log.querySelectorAll('.tl-entry[data-year]')].pop();
    if (last) toggle(last, true);
    goToYear(maxYear);
  },
};
