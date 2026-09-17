// Projects: an Explorer-style folder view from data/projects.json. Opening a
// folder shows a README-style detail page. Deep-links as #projects/<id>.

import { loadData } from '../data.js';
import { esc } from '../ui.js';

const STATUS = { active: '🟢 active', shipped: '✅ shipped', archived: '📦 archived', wip: '🚧 in progress' };
const stars = new Map(); // repo -> stargazers_count, fetched once per session

async function fetchStars(repo) {
  if (!repo) return null;
  if (stars.has(repo)) return stars.get(repo);
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`);
    if (!res.ok) throw new Error(res.status);
    const n = (await res.json()).stargazers_count ?? null;
    stars.set(repo, n);
    return n;
  } catch {
    stars.set(repo, null);
    return null;
  }
}

let state = { root: null, ctx: null, projects: [] };

function renderList() {
  const { root, ctx, projects } = state;
  root.innerHTML = `
    <div class="explorer">
      <div class="ex-toolbar">
        <span class="ex-crumb mono">C:\\Hudson\\Projects</span>
      </div>
      <div class="ex-grid" role="list">
        ${projects.map((p) => `
          <button class="ex-item" role="listitem" data-id="${esc(p.id)}" title="${esc(p.tagline)}">
            <span class="ex-folder" aria-hidden="true"><span class="ex-folder-icon">${esc(p.icon || '📁')}</span></span>
            <span class="ex-name">${esc(p.name)}</span>
            <span class="ex-meta">${p.year || ''}</span>
          </button>`).join('')}
      </div>
    </div>`;
  ctx.setHash(null);
}

async function renderDetail(id) {
  const { root, ctx, projects } = state;
  const p = projects.find((x) => x.id === id);
  if (!p) return renderList();

  root.innerHTML = `
    <div class="explorer">
      <div class="ex-toolbar">
        <button class="btn ex-back" id="ex-back">← Back</button>
        <span class="ex-crumb mono">C:\\Hudson\\Projects\\${esc(p.name)}\\README.txt</span>
      </div>
      <article class="readme">
        <header class="readme-head">
          <span class="readme-icon" aria-hidden="true">${esc(p.icon || '📁')}</span>
          <div>
            <h1>${esc(p.name)}</h1>
            <p class="muted">${esc(p.tagline || '')}</p>
          </div>
        </header>
        <div class="readme-meta">
          ${p.year ? `<span>📅 ${p.year}</span>` : ''}
          ${p.status ? `<span>${STATUS[p.status] || esc(p.status)}</span>` : ''}
          ${p.repo ? `<span id="readme-stars" title="GitHub stars">⭐ …</span>` : ''}
        </div>
        ${(p.description || []).map((d) => `<p>${esc(d)}</p>`).join('')}
        ${p.image ? `<img class="readme-img" src="${esc(p.image)}" alt="${esc(p.name)} screenshot" loading="lazy">` : ''}
        ${(p.tech || []).length ? `<div class="tags">${p.tech.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
        ${(p.links || []).length ? `<div class="readme-links">${p.links.map((l) => `<a class="btn" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label)} ↗</a>`).join('')}</div>` : ''}
      </article>
    </div>`;

  root.querySelector('#ex-back').addEventListener('click', () => { ctx.sfx.play('click'); renderList(); });
  ctx.setHash(p.id);

  if (p.repo) {
    const n = await fetchStars(p.repo);
    const el = root.querySelector('#readme-stars');
    if (el) el.textContent = n === null ? `🐙 ${p.repo}` : `⭐ ${n}`;
  }
}

export default {
  id: 'projects',
  title: 'Coding Projects',
  group: 'hobby',
  icon: '📁',
  size: { w: 640, h: 500 },

  async mount(root, ctx) {
    root.classList.add('no-pad');
    root.innerHTML = '<p class="muted" style="padding:12px">Loading…</p>';
    state = { root, ctx, projects: await loadData('projects') };

    root.addEventListener('click', (e) => {
      const item = e.target.closest('.ex-item');
      if (item) { ctx.sfx.play('open'); renderDetail(item.dataset.id); }
    });

    if (ctx.param) renderDetail(ctx.param); else renderList();
  },

  navigate(param) {
    if (!state.root) return;
    if (param) renderDetail(param); else renderList();
  },
};
