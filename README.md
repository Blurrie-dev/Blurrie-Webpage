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

## Live data

- **Discord status** (tray dot, About "Currently", Contact card) comes from
  [Lanyard](https://github.com/Phineas/lanyard) using `discordId` in
  `data/profile.json`. Join the Lanyard Discord server once and it just works;
  link Spotify to Discord to get now-playing too.
- **GitHub stars** on projects are fetched live when `repo` is set in
  `data/projects.json`.
- **Steam** (recent activity, real hours, artwork) is refreshed every 6 hours by
  `.github/workflows/steam-sync.yml`, which writes `data/steam.json`. Set two
  repository secrets: `STEAM_API_KEY` (from steamcommunity.com/dev/apikey) and
  `STEAM_ID` (SteamID64). Your Steam profile's *Game details* must be public.
  Run it once by hand from the Actions tab; without the file the Games app
  simply uses `data/games.json`.

## Deploy

Hosted on GitHub Pages from the `main` branch (root). Every push to `main`
is live within a minute at <https://blurrie-dev.github.io/Blurrie-Webpage/>.
`.nojekyll` keeps Pages from running Jekyll on the files.

## Layout

```
index.html        the OS shell
css/              base, themes, shell (windows/taskbar), apps
js/wm.js          window manager
js/apps/          one module per app; registry.js lists them
js/gimmicks/      boot screen, shutdown, BSOD, Konami, assistant
js/live.js        Discord presence via Lanyard
scripts/          steam-sync.mjs (run by the GitHub Action)
data/             your content (JSON)
```
