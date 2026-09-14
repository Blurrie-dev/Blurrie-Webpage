// About HudsonOS: version, uptime, and how the thing is built.

import { currentTheme } from '../theme.js';
import { esc } from '../ui.js';

const BOOTED_AT = Date.now();
let timer = null;

function uptime() {
  const s = Math.floor((Date.now() - BOOTED_AT) / 1000);
  const m = Math.floor(s / 60);
  return m ? `${m}m ${s % 60}s` : `${s}s`;
}

export default {
  id: 'sysinfo',
  title: 'About HudsonOS',
  icon: '💾',
  size: { w: 400, h: 340 },
  desktop: false,
  start: false,

  mount(root, ctx) {
    root.innerHTML = `
      <div class="sysinfo">
        <div class="sysinfo-logo" aria-hidden="true">💾</div>
        <h2 style="text-align:center">HudsonOS <span class="muted">v0.4.0</span></h2>
        <dl>
          <dt>Built with</dt><dd>HTML, CSS, JavaScript. No frameworks.</dd>
          <dt>Theme</dt><dd id="si-theme">${esc(currentTheme())}</dd>
          <dt>Viewport</dt><dd id="si-vp">${innerWidth}×${innerHeight}</dd>
          <dt>Uptime</dt><dd id="si-up">${uptime()}</dd>
          <dt>Licence</dt><dd>Hobby project. Be nice.</dd>
          <dt>Secrets</dt><dd>At least one. ↑↑↓↓←→←→BA</dd>
        </dl>
        <div style="text-align:center"><button class="btn" id="si-ok">OK</button></div>
      </div>`;
    root.querySelector('#si-ok').addEventListener('click', ctx.close);
    timer = setInterval(() => {
      root.querySelector('#si-up').textContent = uptime();
      root.querySelector('#si-vp').textContent = `${innerWidth}×${innerHeight}`;
      root.querySelector('#si-theme').textContent = currentTheme();
    }, 1000);
  },

  unmount() {
    clearInterval(timer);
  },
};
