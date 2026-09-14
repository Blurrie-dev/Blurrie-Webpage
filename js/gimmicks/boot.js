// Fake BIOS boot log. Runs once per tab session; any key or tap skips it.

const LINES = [
  ['HudsonOS BIOS v0.1.0', ''],
  ['Copyright (C) 2026 Hudson. All rights reserved (mostly).', 'dim'],
  ['', ''],
  ['Checking memory ............... 640K', 'ok', '(should be enough for anybody)'],
  ['Detecting personality ......... OK', 'ok'],
  ['Mounting /hobbies ............. OK', 'ok'],
  ['Loading hot takes ............. WARNING', 'warn', 'too many'],
  ['Calibrating sense of humour ... OK', 'ok'],
  ['Connecting to Discord ......... SKIPPED', 'dim', 'Phase 5'],
  ['Starting window manager ....... OK', 'ok'],
  ['', ''],
  ['Booting HudsonOS...', ''],
];

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function boot() {
  const KEY = 'hudsonos:booted';
  if (sessionStorage.getItem(KEY)) return;
  sessionStorage.setItem(KEY, '1');

  const screen = document.getElementById('boot');
  const log = document.getElementById('boot-log');
  screen.hidden = false;

  let skipped = false;
  const skip = () => { skipped = true; };
  addEventListener('keydown', skip);
  addEventListener('pointerdown', skip);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  for (const [text, cls, note] of LINES) {
    if (skipped || reduced) break;
    const line = document.createElement('div');
    if (cls) line.className = cls;
    line.textContent = text;
    if (note) line.innerHTML += ` <span class="dim">— ${note}</span>`;
    log.appendChild(line);
    await wait(text ? 90 + Math.random() * 260 : 200);
  }
  if (!skipped && !reduced) await wait(500);

  removeEventListener('keydown', skip);
  removeEventListener('pointerdown', skip);
  screen.remove();
}
