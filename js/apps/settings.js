// Settings: theme, sounds, and a factory reset.

import { THEMES, applyTheme, currentTheme, themeEvents } from '../theme.js';
import { sfx } from '../sfx.js';
import { store } from '../store.js';
import { esc } from '../ui.js';

const SWATCH = {
  fluent: 'linear-gradient(90deg, #072047 50%, #0078d7 50%)',
  luna: 'linear-gradient(90deg, #245edb 50%, #3ea33b 50%)',
  classic: 'linear-gradient(90deg, #008080 50%, #c0c0c0 50%)',
  midnight: 'linear-gradient(90deg, #0a0d16 50%, #7c5cff 50%)',
};

let offTheme = null;

export default {
  id: 'settings',
  title: 'Settings',
  icon: '⚙️',
  size: { w: 420, h: 400 },
  desktop: false,

  mount(root, ctx) {
    root.innerHTML = `
      <div class="settings">
        <fieldset class="fieldset">
          <legend>Appearance</legend>
          ${THEMES.map((t) => `
            <label>
              <input type="radio" name="theme" value="${t.id}">
              <span class="theme-swatch" style="background:${SWATCH[t.id]}" aria-hidden="true"></span>
              <span><b>${esc(t.name)}</b> <span class="muted">— ${esc(t.desc)}</span></span>
            </label>`).join('')}
        </fieldset>
        <fieldset class="fieldset">
          <legend>Sound</legend>
          <label><input type="checkbox" id="set-sound"> Play UI sound effects</label>
        </fieldset>
        <fieldset class="fieldset">
          <legend>Danger zone</legend>
          <p class="muted">Forgets your theme, sound choice and any progress stored in this browser.</p>
          <div class="actions"><button class="btn" id="set-reset">Reset HudsonOS</button></div>
        </fieldset>
      </div>`;

    const sync = () => {
      root.querySelectorAll('input[name="theme"]').forEach((r) => { r.checked = r.value === currentTheme(); });
      root.querySelector('#set-sound').checked = sfx.enabled();
    };
    sync();
    offTheme = () => sync();
    themeEvents.addEventListener('change', offTheme);

    root.addEventListener('change', (e) => {
      if (e.target.name === 'theme') { applyTheme(e.target.value); sfx.play('click'); }
      if (e.target.id === 'set-sound') {
        sfx.setEnabled(e.target.checked);
        document.dispatchEvent(new Event('hudsonos:soundchange'));
        sfx.play('startup');
      }
    });

    root.querySelector('#set-reset').addEventListener('click', () => {
      if (!confirm('Reset HudsonOS to factory settings?')) return;
      store.clear();
      store.session.clear();
      sessionStorage.removeItem('hudsonos:booted');
      location.hash = '';
      location.reload();
    });

    ctx.setStatus('Changes are saved instantly');
  },

  unmount() {
    if (offTheme) themeEvents.removeEventListener('change', offTheme);
  },
};
