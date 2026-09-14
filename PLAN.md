# Hudson's Website — Project Plan

A personal "get-to-know-me" site disguised as a retro desktop operating system.
Vanilla HTML / CSS / JS, no build step, deployable to GitHub Pages.

---

## 1. Concept: "HudsonOS"

The visitor lands on a boot screen, then a desktop. Everything about you is an
*app*. Instead of scrolling a page, they open windows, click icons, type into a
terminal, and stumble onto easter eggs. The site rewards exploration — the
"get-to-know-me" content is spread across apps so poking around *is* the fun.

**Tone:** Windows XP. Bliss wallpaper, glossy blue title bars, the green
"start" button — with modern polish (smooth animations, crisp fonts, responsive).

**Design language**
- Theme system via CSS variables. Default is *Luna* (XP); alternates are
  *Classic* (Win95 beige + bevels) and *Midnight* (dark, neon accents). Theme
  picker lives in Settings; choice persists in `localStorage`.
- Luna chrome: 3px blue window frame, rounded title bar with red close button,
  Tahoma UI text, Trebuchet titles, blue taskbar with a light-blue tray.
- Wallpaper: the real Bliss photo at `assets/wallpapers/bliss.jpg`, with an
  inline-SVG approximation as fallback.
- A single accent colour per theme for highlights, selection, and the taskbar
  clock.
- Sound design (optional, muted by default): startup chime, window open/close
  clicks, error "ding". Toggle in Settings.

---

## 2. Core OS shell (the framework everything sits on)

| Component        | Behaviour |
|------------------|-----------|
| **Boot screen**  | 2–3s fake BIOS/boot log ("Loading personality… OK", "Mounting hobbies… OK"), skippable with any key. Only shows once per session. |
| **Desktop**      | Wallpaper (theme-dependent), grid of icons. Icons are double-click (desktop) / single-tap (mobile) to open. Right-click desktop → context menu (Change wallpaper, Arrange icons, About HudsonOS). |
| **Window manager** | Draggable, resizable, focusable windows with z-index stacking. Minimise to taskbar, maximise, close. Remembers open windows in `sessionStorage` so refresh restores them. |
| **Taskbar**      | Start button, running-app buttons, system tray (theme toggle, sound toggle, live Discord status dot), live clock. |
| **Start menu**   | Lists every app + Shut Down (fades to a "It is now safe to close this tab" screen). |
| **Mobile mode**  | Below ~700px, windows become full-screen "sheets" with a back button; taskbar becomes a bottom nav. Same content, different chrome. |
| **URL routing**  | `#about`, `#projects`, etc. opens that app on load → shareable deep links. |

---

## 3. The apps (content sections)

### 3.1 `About.exe` — who you are
- Short bio with a pixel-art or photo avatar.
- "Currently" widget: what you're playing / listening to / building right now
  (hand-edited JSON, or live — see §5).
- Quick stats cards (location, timezone with live local time, years coding, etc.).

### 3.2 `Timeline.exe` — your story
- Vertical timeline styled like a file-explorer tree or a Git log
  (`* 2019 — started coding`, branches for side quests).
- Each node expands to a short story + optional image.
- Scrub-able: drag a slider in the window's status bar to "travel" through years.

### 3.3 `Projects.exe` — coding portfolio
- File-explorer layout: each project is a "folder" with an icon.
- Opening a project shows a README-style window: description, tech tags, screenshots,
  links (repo / live).
- Optional: GitHub API (public, no key needed) to pull repo star counts and a
  contribution heatmap rendered in the window.

### 3.4 `Hobbies/` — a folder of mini-apps
Each hobby gets its own tiny app so it can have its own gimmick, e.g.:
- **Music.exe** — a Winamp-style player skin listing favourite albums/artists; can
  embed Spotify/Apple Music previews.
- **Games.exe** — a Steam-library-style grid of favourite games with hours and a
  one-line review. Links to your Steam profile. (Live data option in §5.)
- **Food / Travel / Sports / Collections** — whichever apply; a Photo Viewer app
  with a lightbox gallery covers most of these.

### 3.5 `Quiz.exe` — personality & fun facts
- "How well do you know Hudson?" — 8–10 multiple-choice questions, score screen
  with a shareable result ("You scored 7/10 — Acquaintance tier").
- Hot Takes card stack: swipe/click through opinionated one-liners.
- Random Fact button (pulls from a JSON array; never repeats until exhausted).

### 3.6 `Contact.exe` & socials
- Contact card window with big icon buttons: Discord, Steam, GitHub, plus any
  others (X/Twitter, Instagram, LinkedIn, YouTube, Bluesky…).
- **Discord:** link `https://discord.com/users/<your-user-id>` (opens the app/web
  profile) *and* a "Copy username" button with a toast. Optionally a server invite.
- **Steam:** link `https://steamcommunity.com/id/<vanity>` or `/profiles/<id64>`.
- Email: a "Compose" mini-form that opens a `mailto:` (no backend needed), or a
  Formspree/Netlify Forms endpoint if you want real submissions.

### 3.7 `Terminal.exe` — the power-user path
- Fake shell with commands: `help`, `about`, `projects`, `skills`, `socials`,
  `open <app>`, `theme <name>`, `clear`, `neofetch` (prints an ASCII logo + your
  stats), `sudo` (funny denial), `rm -rf /` (fake BSOD easter egg).
- Tab-completion and command history (↑/↓).

---

## 4. Gimmicks & easter eggs (the "cool" list)

Prioritised roughly by effort-to-delight ratio.

1. **Boot sequence + BSOD** — the fake crash on `rm -rf /` or after clicking a
   "Do not press" button; press any key to "reboot" back to the desktop.
2. **Konami code** (↑↑↓↓←→←→BA) → unlocks a hidden app (e.g. a retro mini-game
   or a secret "Confessions.txt").
3. **Minesweeper / Snake / Solitaire clone** — one small playable game, because
   every OS had one. Snake is ~150 lines and very satisfying.
4. **Clippy-style assistant** — a little character in the corner that offers
   context hints ("It looks like you're reading my bio. Want to see my projects?")
   with a dismiss button. Great for guiding visitors to content.
5. **Live wallpaper** — subtle canvas animation (starfield, pipes screensaver,
   Matrix rain) chosen per theme; low CPU, pauses when tab hidden.
6. **Screensaver** — after 60s idle, the classic bouncing-DVD-logo / flying
   toasters takes over; any input dismisses it.
7. **Achievements** — small toasts for exploring: "Opened 5 apps", "Found the
   terminal", "Scored 10/10". Stored in `localStorage`; an `Achievements.exe`
   shows progress. Turns browsing into a light game.
8. **Drag-and-drop desktop** — rearrange icons, drop a project onto the Recycle
   Bin for a "Nice try." dialog.
9. **Cursor trail / custom cursor** toggle in Settings.
10. **Visitor "guestbook"** — optional; needs a tiny backend (see §9).

---

## 5. Live data from your accounts (static-site friendly)

| Source   | Method | Notes |
|----------|--------|-------|
| **Discord live status** | [Lanyard API](https://github.com/Phineas/lanyard) — public, CORS-enabled, no key | Join the Lanyard Discord server once; then `GET https://api.lanyard.rest/v1/users/<id>` returns your online status and current game/Spotify activity. Perfect for the taskbar tray dot + "Currently" widget. |
| **GitHub** | Public REST API, no key for low volume | Hand-list featured repos in JSON and fetch their star counts live. Contribution heatmap: render from a JSON you commit, or a public contributions mirror. |
| **Steam recently played / hours** | Steam Web API needs a key and has no CORS | Run a **GitHub Action** on a schedule (e.g. every 6h) that calls the Steam API with a secret key and commits `data/steam.json`. The site just reads that file. Same pattern works for Last.fm / Spotify. |
| **Spotify now-playing** | Comes free through Lanyard if Spotify is linked to Discord | Zero setup beyond Lanyard. |

Everything degrades gracefully: if a fetch fails, the widget shows hand-edited
fallback data from `data/*.json`.

---

## 6. Architecture & file layout

```
/
├── index.html              # single page; the OS shell
├── css/
│   ├── base.css            # reset, variables, typography
│   ├── themes.css          # [data-theme] variable sets
│   ├── shell.css           # desktop, taskbar, windows, start menu
│   └── apps.css            # per-app styles
├── js/
│   ├── main.js             # boot → desktop init
│   ├── wm.js               # window manager (open/close/drag/resize/focus)
│   ├── taskbar.js
│   ├── startmenu.js
│   ├── router.js           # hash <-> open apps
│   ├── store.js            # localStorage/sessionStorage helpers, achievements
│   ├── sfx.js              # sound toggles
│   ├── apps/
│   │   ├── registry.js     # list of apps: id, title, icon, module
│   │   ├── about.js
│   │   ├── timeline.js
│   │   ├── projects.js
│   │   ├── games.js
│   │   ├── music.js
│   │   ├── quiz.js
│   │   ├── contact.js
│   │   ├── terminal.js
│   │   ├── settings.js
│   │   └── snake.js
│   └── gimmicks/
│       ├── boot.js
│       ├── bsod.js
│       ├── konami.js
│       ├── screensaver.js
│       ├── wallpaper.js
│       └── assistant.js
├── data/                   # ALL personal content lives here as JSON
│   ├── profile.json        # bio, socials, currently
│   ├── timeline.json
│   ├── projects.json
│   ├── hobbies.json
│   ├── quiz.json
│   ├── facts.json
│   └── steam.json          # written by GitHub Action (optional)
├── assets/
│   ├── icons/              # app icons (SVG or 32px PNG)
│   ├── wallpapers/
│   ├── images/
│   └── sfx/
├── .github/workflows/
│   └── steam-sync.yml      # optional scheduled data fetch
└── PLAN.md
```

**Key design rule:** content never lives in JS. Every app renders from
`data/*.json`, so updating your bio or adding a project is a JSON edit.

**App contract** (keeps apps decoupled from the window manager):
```js
// js/apps/about.js
export default {
  id: 'about', title: 'About Me', icon: 'assets/icons/about.svg',
  size: { w: 520, h: 420 },
  mount(root, ctx) { /* render into root; ctx has store, sfx, openApp */ },
  unmount() {}
}
```

**No frameworks.** ES modules in the browser, CSS variables, `<template>`
elements for window chrome. Optional CDN libs later: GSAP (if animations get
complex), nothing else planned.

---

## 7. Build phases

Each phase ends with something deployable.

**Phase 0 — Setup (½ day)**
- `git init`, GitHub repo, GitHub Pages enabled, `index.html` "Hello desktop".
- Fill in `data/profile.json` with real bio + social links.

**Phase 1 — The shell (2–3 days)**
- Desktop, icons, window manager (drag/resize/focus/min/max/close), taskbar,
  start menu, one theme, hash routing, mobile sheet mode.
- Stub every app with placeholder text so navigation works end to end.

**Phase 2 — Content apps (2–3 days)**
- About, Timeline, Projects, Contact (with Discord/Steam/etc. links), Settings
  with theme switcher. Real content from JSON.

**Phase 3 — Personality apps (2 days)**
- Quiz, Hot Takes, Random Fact, Games grid, Music player skin, Photo viewer.

**Phase 4 — Gimmicks (2–4 days, pick and choose)**
- Boot screen, Terminal, BSOD, Konami unlock, Snake, screensaver, live
  wallpaper, achievements, assistant.

**Phase 5 — Live data (1 day)**
- Lanyard for Discord status + Spotify; GitHub stars; optional Steam Action.

**Phase 6 — Polish**
- Sound effects, accessibility pass (keyboard nav for windows, focus rings,
  `prefers-reduced-motion` disables animations/wallpaper), Lighthouse check,
  OG image + meta tags so links preview nicely on Discord.

---

## 8. Things you'll need to supply

- Bio text, avatar/photo, timeline events, project list (name, blurb, links,
  screenshot), hobby lists, ~10 quiz questions, ~20 fun facts / hot takes.
- Social handles/URLs: Discord user ID + username, Steam profile URL, GitHub,
  and any others.
- (Optional) Steam Web API key if you want live Steam data.

---

## 9. Open decisions (can defer)

- Which wallpaper animation per theme.
- Whether to include a guestbook (needs a free backend like a Cloudflare Worker + KV).
- Custom domain vs `username.github.io`.
