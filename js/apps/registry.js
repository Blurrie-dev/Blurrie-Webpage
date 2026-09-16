// Every app the OS knows about, in desktop/start-menu order.
// App shape: { id, title, icon, size?, desktop?, start?, secret?, group?, mount(root, ctx), unmount?(), navigate?(param) }
//   desktop: false → no desktop icon   start: false → not in the Start menu
//   secret: true   → hidden everywhere until store 'unlocked:<id>' is set (see gimmicks/konami.js)
//   group: 'hobby' → second column of desktop icons

import { store } from '../store.js';
import about from './about.js';
import projects from './projects.js';
import games from './games.js';
import music from './music.js';
import terminal from './terminal.js';
import snake from './snake.js';
import contact from './contact.js';
import ask from './ask.js';
import settings from './settings.js';
import sysinfo from './sysinfo.js';
import { hobbyApp } from './hobby.js';

export const apps = [
  about,
  music,
  terminal,
  snake,
  contact,
  ask,
  settings,
  sysinfo,
  // Hobbies
  hobbyApp({ id: 'kendo', title: 'Kendo', icon: '🥋' }),
  hobbyApp({ id: 'guitar', title: 'Guitar', icon: '🎸' }),
  hobbyApp({ id: 'astronomy', title: 'Astronomy', icon: '🔭' }),
  hobbyApp({ id: 'camping', title: 'Camping', icon: '🏕️' }),
  hobbyApp({ id: 'running', title: 'Running', icon: '🏃' }),
  projects,
  games,
];

export const getApp = (id) => apps.find((a) => a.id === id);
export const isVisible = (a) => !a.secret || store.get(`unlocked:${a.id}`, false);
