# HudsonOS

A personal website disguised as a retro desktop operating system.
Vanilla HTML / CSS / JS — no build step, no dependencies.

See [PLAN.md](PLAN.md) for the full design and roadmap.

## Run locally

ES modules and `fetch()` need a real HTTP server (opening `index.html` directly won't work):

```bash
python -m http.server 5173
```

Then open <http://localhost:5173>.

## Editing content

All personal content lives in `data/*.json` — nothing is hard-coded in JS.
Start with `data/profile.json` (bio, location, socials).

## Layout

```
index.html        the OS shell
css/              base, themes, shell (windows/taskbar), apps
js/wm.js          window manager
js/apps/          one module per app; registry.js lists them
js/gimmicks/      boot screen, shutdown, easter eggs
data/             your content (JSON)
```
