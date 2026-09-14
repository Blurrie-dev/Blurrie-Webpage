// ↑ ↑ ↓ ↓ ← → ← → B A — unlocks Snake.exe and puts it on the desktop.

import { store } from '../store.js';
import { toast } from '../ui.js';
import { openApp } from '../wm.js';
import { refreshDesktop } from '../desktop.js';
import { unlock } from '../achievements.js';

const CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

export const isUnlocked = (id) => store.get(`unlocked:${id}`, false);

export function unlockApp(id) {
  const fresh = !isUnlocked(id);
  store.set(`unlocked:${id}`, true);
  refreshDesktop();
  return fresh;
}

export function initKonami() {
  let pos = 0;
  addEventListener('keydown', (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    pos = key === CODE[pos] ? pos + 1 : (key === CODE[0] ? 1 : 0);
    if (pos !== CODE.length) return;
    pos = 0;
    const fresh = unlockApp('snake');
    unlock('konami');
    toast(fresh ? 'Cheat code accepted. Snake.exe installed on the desktop.' : 'Cheat code accepted. Again.', { icon: '🎮', duration: 5000 });
    setTimeout(() => openApp('snake'), 600);
  });
}
