// Contact: social links from data/profile.json, with copy-to-clipboard for handles.

import { loadData } from '../data.js';
import { esc } from '../ui.js';
import { live, presence, STATUS, describe } from '../live.js';

let onLive = null;

const ICONS = {
  discord: '💬', steam: '🎮', github: '🐙', email: '✉️', twitter: '🐦', x: '✖️',
  instagram: '📸', linkedin: '💼', youtube: '📺', bluesky: '🦋', twitch: '🎥', spotify: '🎵',
};

export default {
  id: 'contact',
  title: 'Contact',
  icon: '📇',
  size: { w: 520, h: 400 },

  async mount(root, ctx) {
    root.innerHTML = '<p class="muted">Loading…</p>';
    const p = await loadData('profile');
    const socials = p.socials || [];

    root.innerHTML = `
      <p>${esc(p.contactBlurb || 'Find me around the internet:')}</p>
      <div class="contact-grid">
        ${socials.map((s) => `
          <a class="social" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" data-id="${esc(s.id)}">
            <span class="social-icon" aria-hidden="true">${esc(s.icon || ICONS[s.id] || '🔗')}</span>
            <b>${esc(s.label)}</b>
            ${s.handle ? `<small>${esc(s.handle)}</small>` : ''}
            ${s.id === 'discord' ? '<span class="social-live" id="contact-live" hidden><i></i><span></span></span>' : ''}
          </a>`).join('')}
      </div>
      <div class="social-row">
        ${socials.filter((s) => s.copy).map((s) => `
          <button class="btn" data-copy="${esc(s.copy)}" data-label="${esc(s.label)}">Copy ${esc(s.label)} handle</button>`).join('')}
      </div>`;

    root.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-copy]');
      if (!btn) return;
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        ctx.toast(`Copied ${btn.dataset.copy} to clipboard`, { icon: '📋' });
      } catch {
        ctx.toast(`My ${btn.dataset.label}: ${btn.dataset.copy}`, { icon: '📋', duration: 6000 });
      }
    });

    const liveEl = root.querySelector('#contact-live');
    const renderLive = (p) => {
      if (!p || !liveEl) return;
      const st = STATUS[p.status] || STATUS.offline;
      const d = describe(p);
      liveEl.hidden = false;
      liveEl.querySelector('i').style.background = st.color;
      liveEl.querySelector('span').textContent = d && d.text !== st.label ? `${st.label} · ${d.text}` : st.label;
    };
    renderLive(presence());
    onLive = (e) => renderLive(e.detail);
    live.addEventListener('update', onLive);

  },

  unmount() {
    if (onLive) live.removeEventListener('update', onLive);
    onLive = null;
  },
};
