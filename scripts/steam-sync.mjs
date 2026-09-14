// Fetches recently-played and most-played games from the Steam Web API and
// writes data/steam.json. Run by .github/workflows/steam-sync.yml on a
// schedule; can also be run locally:
//
//   STEAM_API_KEY=... STEAM_ID=76561198965734883 node scripts/steam-sync.mjs
//
// Needs the profile's "Game details" privacy setting set to Public.

import { writeFile } from 'node:fs/promises';

const KEY = process.env.STEAM_API_KEY;
const ID = process.env.STEAM_ID;
if (!KEY || !ID) {
  console.error('STEAM_API_KEY and STEAM_ID are required');
  process.exit(1);
}

const api = async (path, params) => {
  const url = new URL(`https://api.steampowered.com/${path}`);
  url.search = new URLSearchParams({ key: KEY, steamid: ID, format: 'json', ...params });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
  return (await res.json()).response || {};
};

const pick = (g) => ({
  appid: g.appid,
  name: g.name,
  hours: Math.round((g.playtime_forever || 0) / 60),
  hours2w: Math.round(((g.playtime_2weeks || 0) / 60) * 10) / 10,
  image: `https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appid}/header.jpg`,
});

const recent = await api('IPlayerService/GetRecentlyPlayedGames/v1/', { count: 6 });
const owned = await api('IPlayerService/GetOwnedGames/v1/', { include_appinfo: 1, include_played_free_games: 1 });

const games = (owned.games || []).filter((g) => g.playtime_forever > 0);
const out = {
  updated: new Date().toISOString(),
  totalGames: owned.game_count || games.length,
  totalHours: Math.round(games.reduce((s, g) => s + g.playtime_forever, 0) / 60),
  recent: (recent.games || []).map(pick),
  top: games.sort((a, b) => b.playtime_forever - a.playtime_forever).slice(0, 12).map(pick),
};

await writeFile(new URL('../data/steam.json', import.meta.url), JSON.stringify(out, null, 2) + '\n');
console.log(`steam.json: ${out.recent.length} recent, ${out.top.length} top, ${out.totalHours}h total`);
