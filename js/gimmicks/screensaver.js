// After a minute of no input, the bouncing-logo screensaver takes over.
// Any input dismisses it. Pauses when the tab is hidden.

import { unlock } from '../achievements.js';

const IDLE_MS = 60_000;
const COLORS = ['#ff5f57', '#febc2e', '#28c840', '#0078d7', '#c86dd7', '#00e5c8', '#ff8c00'];

let idleTimer = null;
let el = null;
let raf = null;

function start() {
  if (el) return;
  el = document.createElement('div');
  el.className = 'screensaver';
  el.innerHTML = '<div class="ss-logo"><b>Hudson</b>OS</div>';
  document.body.appendChild(el);
  unlock('screensaver');

  const logo = el.querySelector('.ss-logo');
  let x = Math.random() * 200, y = Math.random() * 200, dx = 2.2, dy = 1.8, ci = 0;
  const step = () => {
    const W = el.clientWidth - logo.offsetWidth;
    const H = el.clientHeight - logo.offsetHeight;
    x += dx; y += dy;
    let bounced = false;
    if (x <= 0 || x >= W) { dx = -dx; x = Math.max(0, Math.min(W, x)); bounced = true; }
    if (y <= 0 || y >= H) { dy = -dy; y = Math.max(0, Math.min(H, y)); bounced = true; }
    if (bounced) { ci = (ci + 1) % COLORS.length; logo.style.color = COLORS[ci]; }
    logo.style.transform = `translate(${x}px, ${y}px)`;
    raf = requestAnimationFrame(step);
  };
  logo.style.color = COLORS[0];
  raf = requestAnimationFrame(step);
}

function stop() {
  if (!el) return;
  cancelAnimationFrame(raf);
  el.remove();
  el = null;
}

function armIdle() {
  clearTimeout(idleTimer);
  if (document.hidden) return;
  idleTimer = setTimeout(start, IDLE_MS);
}

export function initScreensaver() {
  const activity = (e) => {
    if (el) {
      // Swallow the input that woke the screen so it doesn't also hit the desktop
      e.stopPropagation();
      if (e.type === 'keydown') e.preventDefault();
      stop();
    }
    armIdle();
  };
  ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'].forEach((t) =>
    addEventListener(t, activity, { capture: true, passive: t !== 'keydown' }));
  document.addEventListener('visibilitychange', () => { document.hidden ? (clearTimeout(idleTimer), stop()) : armIdle(); });
  armIdle();
}
