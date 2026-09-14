// Entry point: boot → build the shell → restore windows → open the deep link.

import { initTheme } from './theme.js';
import { boot } from './gimmicks/boot.js';
import { initDesktop } from './desktop.js';
import { initTaskbar } from './taskbar.js';
import { initStartMenu } from './startmenu.js';
import { initRouter } from './router.js';
import { restoreWindows } from './wm.js';
import { sfx } from './sfx.js';

initTheme();
await boot();

initDesktop();
initTaskbar();
initStartMenu();

const openFromHash = initRouter();
restoreWindows();
openFromHash();

sfx.play('startup');
