// Placeholder app used until the real one is built.

import { esc } from '../ui.js';

export function stubApp({ id, title, icon, size, phase, blurb, ...rest }) {
  return {
    id, title, icon, size, ...rest,
    mount(root) {
      root.innerHTML = `
        <div class="app-stub">
          <div class="app-stub-icon" aria-hidden="true">${esc(icon)}</div>
          <h2>${esc(title)}</h2>
          <p class="muted">${esc(blurb)}</p>
          <span class="phase">under construction · phase ${esc(phase)}</span>
        </div>`;
    },
  };
}
