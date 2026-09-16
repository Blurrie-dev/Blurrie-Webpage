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
- **Steam** — the Games app shows your real library (top 25 by hours, recent
  activity, artwork, last played) from `data/steam.json`, refreshed every 6
  hours by `.github/workflows/steam-sync.yml`. `data/games.json` then only adds
  your own ratings / takes / status to matching titles, plus any non-Steam
  games. To enable:
  1. Steam → Edit Profile → Privacy Settings → **Game details: Public**
     (and untick "Always keep my total playtime private").
  2. Get a key at <https://steamcommunity.com/dev/apikey> (any domain name).
  3. Repo → Settings → Secrets and variables → Actions → add `STEAM_API_KEY`
     and `STEAM_ID` (`76561198965734883`).
  4. Actions tab → *Sync Steam data* → *Run workflow*. It commits
     `data/steam.json`; pull to get it locally.
  Or run it locally: `$env:STEAM_API_KEY="..."; $env:STEAM_ID="76561198965734883"; node scripts/steam-sync.mjs`

## Ask Hudson (Claude)

The ✨ *Ask Hudson* app is a chat window backed by Claude Haiku 4.5 through a
tiny Cloudflare Worker in `worker/` (the API key never touches the browser).
See `worker/README.md` — deploy it, paste its `/chat` URL into
`data/profile.json → assistant.endpoint`, and the app lights up. Until then
it shows a "not connected" note.

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
js/gimmicks/      boot screen, shutdown, BSOD, Konami
js/live.js        Discord presence via Lanyard
scripts/          steam-sync.mjs (run by the GitHub Action)
worker/           Cloudflare Worker behind the Ask Hudson app
data/             your content (JSON)
```
