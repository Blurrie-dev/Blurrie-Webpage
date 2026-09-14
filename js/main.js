// Entry point: boot → build the shell → restore windows → open the deep link → arm the gimmicks.

import { initTheme, themeEvents } from './theme.js';
import { boot } from './gimmicks/boot.js';
import { initDesktop } from './desktop.js';
import { initTaskbar } from './taskbar.js';
import { initStartMenu } from './startmenu.js';
import { initRouter } from './router.js';
import { restoreWindows, wm } from './wm.js';
import { sfx } from './sfx.js';
import { store } from './store.js';
import { apps } from './apps/registry.js';
import { initAchievements } from './achievements.js';
import { initKonami } from './gimmicks/konami.js';
import { initScreensaver } from './gimmicks/screensaver.js';
import { initAssistant } from './gimmicks/assistant.js';

initTheme();
await boot();

initDesktop();
initTaskbar();
initStartMenu();
initAchievements({ wm, themeEvents, apps });

const openFromHash = initRouter();
restoreWindows();
openFromHash();

initKonami();
initScreensaver();
initAssistant({ wm, store });

sfx.play('startup');
