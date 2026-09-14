// "It is now safe to close this tab." — with an escape hatch.

import { sfx } from '../sfx.js';
import { closeAll } from '../wm.js';

export function shutdown() {
  sfx.play('shutdown');
  closeAll();
  const el = document.createElement('div');
  el.className = 'shutdown';
  el.innerHTML = `
    <div>
      <p>It is now safe to close this tab.</p>
      <button class="btn" id="reboot">Just kidding, reboot</button>
    </div>`;
  document.body.appendChild(el);
  el.querySelector('#reboot').addEventListener('click', () => {
    sessionStorage.removeItem('hudsonos:booted'); // show the boot screen again
    location.hash = '';
    location.reload();
  });
}
