// Every app the OS knows about, in desktop/start-menu order.
// App shape: { id, title, icon, size?, desktop?, start?, secret?, mount(root, ctx), unmount?(), navigate?(param) }
//   desktop: false → no desktop icon   start: false → not in the Start menu
//   secret: true   → hidden everywhere until store 'unlocked:<id>' is set (see gimmicks/konami.js)

import { store } from '../store.js';
import about from './about.js';
import timeline from './timeline.js';
import projects from './projects.js';
import games from './games.js';
import music from './music.js';
import quiz from './quiz.js';
import terminal from './terminal.js';
import snake from './snake.js';
import achievements from './achievements.js';
import contact from './contact.js';
import settings from './settings.js';
import sysinfo from './sysinfo.js';

export const apps = [
  about,
  timeline,
  projects,
  games,
  music,
  quiz,
  terminal,
  snake,
  contact,
  achievements,
  settings,
  sysinfo,
];

export const getApp = (id) => apps.find((a) => a.id === id);
export const isVisible = (a) => !a.secret || store.get(`unlocked:${a.id}`, false);
