// Hobbies: one app per entry in data/hobbies.json (Kendo, Guitar, …). Each is a
// simple page: big icon, tagline, a few paragraphs, facts, and links.

import { loadData } from '../data.js';
import { esc } from '../ui.js';

export const hobbyApp = ({ id, title, icon }) => ({
  id,
  title,
  icon,
  group: 'hobby',
  size: { w: 480, h: 440 },

  async mount(root) {
    const h = (await loadData('hobbies')).find((x) => x.id === id) || {};
    root.innerHTML = `
      <div class="hobby">
        <header class="hobby-hero">
          <span class="hobby-icon" aria-hidden="true">${esc(icon)}</span>
          <div>
            <h2>${esc(title)}</h2>
            ${h.tagline ? `<p class="muted">${esc(h.tagline)}</p>` : ''}
          </div>
        </header>
        ${(h.body || []).map((p) => `<p>${esc(p)}</p>`).join('')}
        ${h.facts?.length ? `<dl class="hobby-facts">${h.facts.map((f) => `<dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd>`).join('')}</dl>` : ''}
        ${h.photos?.length ? `<div class="hobby-photos">${h.photos.map((ph) => {
          const src = typeof ph === 'string' ? ph : ph.src;
          const cap = typeof ph === 'string' ? '' : ph.caption || '';
          return `<figure><a href="${esc(src)}" target="_blank" rel="noopener"><img src="${esc(src)}" alt="${esc(cap)}" loading="lazy"></a>${cap ? `<figcaption>${esc(cap)}</figcaption>` : ''}</figure>`;
        }).join('')}</div>` : ''}
        ${h.links?.length ? `<p class="hobby-links">${h.links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label)} ↗</a>`).join('')}</p>` : ''}
      </div>`;
  },
});
