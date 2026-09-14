// Every app the OS knows about, in desktop/start-menu order.
// App shape: { id, title, icon, size?, desktop?, start?, mount(root, ctx), unmount?() }
//   desktop: false  → no desktop icon      start: false → not in the Start menu

import { stubApp } from './stub.js';
import about from './about.js';
import timeline from './timeline.js';
import projects from './projects.js';
import games from './games.js';
import music from './music.js';
import quiz from './quiz.js';
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
  stubApp({ id: 'terminal', title: 'Terminal', icon: '🖥️', size: { w: 600, h: 400 }, phase: 4,
    blurb: 'For people who would rather type.' }),
  contact,
  settings,
  sysinfo,
];

export const getApp = (id) => apps.find((a) => a.id === id);
