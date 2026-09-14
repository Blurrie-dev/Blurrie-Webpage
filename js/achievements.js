// Achievements: small rewards for exploring. Unlocks persist in localStorage
// and pop a toast. Apps and gimmicks call unlock('id'); the shell-level ones
// (first window, every app, every theme, night owl) are tracked here.

import { store } from './store.js';
import { toast } from './ui.js';
import { sfx } from './sfx.js';

export const ACHIEVEMENTS = [
  { id: 'hello',        icon: '👋', title: 'Hello, World',               desc: 'Opened your first window.' },
  { id: 'explorer',     icon: '🧭', title: 'Explorer',                   desc: 'Opened five different apps.' },
  { id: 'completionist',icon: '🏆', title: 'Completionist',              desc: 'Opened every app on the desktop.' },
  { id: 'hacker',       icon: '🖥️', title: 'Hacker',                     desc: 'Found the terminal.' },
  { id: 'neofetch',     icon: '🐧', title: 'Ricer',                      desc: 'Ran neofetch. Of course you did.' },
  { id: 'sudo',         icon: '🚫', title: 'Not in the sudoers file',    desc: 'Tried sudo. This incident has been reported.' },
  { id: 'bsod',         icon: '💀', title: 'Blue Screen of Death',       desc: 'Broke it. Congratulations.' },
  { id: 'konami',       icon: '🎮', title: 'Up Up Down Down',            desc: 'Entered the Konami code.', secret: true },
  { id: 'snake10',      icon: '🐍', title: 'Snake Charmer',              desc: 'Scored 10 in Snake.', secret: true },
  { id: 'snake30',      icon: '🐉', title: 'Ouroboros',                  desc: 'Scored 30 in Snake.', secret: true },
  { id: 'quiz-done',    icon: '❓', title: 'Pop Quiz',                   desc: 'Finished the quiz.' },
  { id: 'quiz-perfect', icon: '🕵️', title: 'Suspiciously Well-Informed', desc: 'Perfect quiz score.' },
  { id: 'themer',       icon: '🎨', title: 'Interior Decorator',         desc: 'Tried every theme.' },
  { id: 'screensaver',  icon: '📀', title: 'AFK',                        desc: 'Watched the screensaver. Did it hit the corner?' },
  { id: 'shutdown',     icon: '⏻', title: 'Goodbye',                    desc: 'Shut the computer down. Rude.' },
  { id: 'nightowl',     icon: '🦉', title: 'Night Owl',                  desc: 'Visited between midnight and 5am.' },
  { id: 'clippy',       icon: '📎', title: 'Not Now, Clippy',            desc: 'Told the assistant to stop helping.' },
];

export const events = new EventTarget();
export const unlocked = () => store.get('achievements', []);
export const has = (id) => unlocked().includes(id);

export function unlock(id) {
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  if (!a || has(id)) return false;
  store.set('achievements', [...unlocked(), id]);
  sfx.play('startup');
  toast(`Achievement unlocked: ${a.title}`, { icon: a.icon, duration: 4500 });
  events.dispatchEvent(new CustomEvent('unlock', { detail: { id } }));
  return true;
}

export function resetAchievements() {
  store.remove('achievements');
  store.remove('apps-opened');
  store.remove('themes-seen');
}

// Shell-level triggers. Receives the wm and theme buses to avoid import cycles.
export function initAchievements({ wm, themeEvents, apps }) {
  wm.addEventListener('open', (e) => {
    unlock('hello');
    const seen = new Set(store.get('apps-opened', []));
    seen.add(e.detail.id);
    store.set('apps-opened', [...seen]);
    if (e.detail.id === 'terminal') unlock('hacker');
    if (seen.size >= 5) unlock('explorer');
    const desktopApps = apps.filter((a) => a.desktop !== false && !a.secret).map((a) => a.id);
    if (desktopApps.every((id) => seen.has(id))) unlock('completionist');
  });

  themeEvents.addEventListener('change', (e) => {
    const seen = new Set(store.get('themes-seen', []));
    seen.add(e.detail.id);
    store.set('themes-seen', [...seen]);
    if (seen.size >= 4) unlock('themer');
  });

  const hour = new Date().getHours();
  if (hour < 5) setTimeout(() => unlock('nightowl'), 4000);
}
