// Entry point: boot → build the shell → restore windows → open the deep link → arm the gimmicks.

import { initTheme } from './theme.js';
import { boot } from './gimmicks/boot.js';
import { initDesktop } from './desktop.js';
import { initTaskbar } from './taskbar.js';
import { initStartMenu } from './startmenu.js';
import { initRouter } from './router.js';
import { restoreWindows, wm } from './wm.js';
import { sfx } from './sfx.js';
import { initKonami } from './gimmicks/konami.js';
import { initAssistant } from './gimmicks/assistant.js';
import { initLive } from './live.js';

initTheme();
await boot();

initDesktop();
initTaskbar();
initStartMenu();

const openFromHash = initRouter();
restoreWindows();
openFromHash();

initKonami();
initAssistant({ wm });
initLive();

sfx.play('startup');
