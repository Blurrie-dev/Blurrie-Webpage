// Fake Windows 10 blue screen. Counts to 100%, then any key / tap "reboots"
// back to the desktop (everything is still there — it's just an overlay).

import { sfx } from '../sfx.js';

let active = false;

export function bsod(stopCode = 'CRITICAL_PROCESS_DIED', detail = '') {
  if (active) return;
  active = true;
  sfx.play('error');

  const el = document.createElement('div');
  el.className = 'bsod';
  el.setAttribute('role', 'alertdialog');
  el.innerHTML = `
    <div class="bsod-inner">
      <div class="bsod-face">:(</div>
      <p>Your PC ran into a problem and needs to restart. We're just collecting some error info, and then we'll restart for you.</p>
      <p class="bsod-pct"><span id="bsod-pct">0</span>% complete</p>
      <div class="bsod-foot">
        <div class="bsod-qr" aria-hidden="true"></div>
        <div>
          <p>For more information about this issue and possible fixes, visit the About Me window.</p>
          <p class="bsod-small">If you call a support person, give them this info:<br>Stop code: ${stopCode}${detail ? `<br>What failed: ${detail}` : ''}</p>
        </div>
      </div>
      <p class="bsod-hint" id="bsod-hint" hidden>Press any key to restart.</p>
    </div>`;
  document.body.appendChild(el);

  const pct = el.querySelector('#bsod-pct');
  const hint = el.querySelector('#bsod-hint');
  let n = 0;
  const tick = setInterval(() => {
    n = Math.min(100, n + Math.floor(Math.random() * 9) + 1);
    pct.textContent = n;
    if (n >= 100) { clearInterval(tick); hint.hidden = false; }
  }, 220);

  const dismiss = (e) => {
    e.preventDefault();
    e.stopPropagation();
    clearInterval(tick);
    removeEventListener('keydown', dismiss, true);
    removeEventListener('pointerdown', dismiss, true);
    el.classList.add('bsod-off');
    setTimeout(() => { el.remove(); active = false; sfx.play('startup'); }, 350);
  };
  // Arm after a beat so the keypress that triggered the crash doesn't clear it
  setTimeout(() => {
    addEventListener('keydown', dismiss, true);
    addEventListener('pointerdown', dismiss, true);
  }, 800);
}
