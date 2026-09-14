// Live Discord presence via Lanyard (https://github.com/Phineas/lanyard).
// Uses the WebSocket for real-time updates, falls back to polling the REST
// endpoint. Emits 'update' on `live` with a normalised presence object.
//
// Requires profile.discordId and that the user has joined the Lanyard server.

import { loadData } from './data.js';

export const live = new EventTarget();

export const STATUS = {
  online:  { label: 'Online',         color: '#23a55a' },
  idle:    { label: 'Idle',           color: '#f0b232' },
  dnd:     { label: 'Do not disturb', color: '#f23f43' },
  offline: { label: 'Offline',        color: '#80848e' },
};

let current = null;
export const presence = () => current;

function normalise(d) {
  if (!d) return null;
  const activities = d.activities || [];
  const game = activities.find((a) => a.type === 0);
  const custom = activities.find((a) => a.type === 4);
  const spotify = d.listening_to_spotify && d.spotify ? {
    song: d.spotify.song, artist: d.spotify.artist, album: d.spotify.album,
    art: d.spotify.album_art_url, id: d.spotify.track_id,
  } : null;
  return {
    status: d.discord_status || 'offline',
    user: d.discord_user ? { name: d.discord_user.global_name || d.discord_user.username, username: d.discord_user.username } : null,
    game: game ? { name: game.name, details: game.details || '', state: game.state || '', since: game.timestamps?.start || null } : null,
    spotify,
    custom: custom ? { text: custom.state || '', emoji: custom.emoji?.name || '' } : null,
    updatedAt: Date.now(),
  };
}

function publish(data) {
  current = normalise(data);
  live.dispatchEvent(new CustomEvent('update', { detail: current }));
}

async function poll(id) {
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${id}`);
    const json = await res.json();
    if (json.success) publish(json.data);
  } catch { /* offline or blocked; keep last state */ }
}

function connectSocket(id, onFail) {
  let ws, heartbeat, failed = false;
  const fail = () => { if (failed) return; failed = true; clearInterval(heartbeat); onFail(); };
  try {
    ws = new WebSocket('wss://api.lanyard.rest/socket');
  } catch { return fail(); }
  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    if (msg.op === 1) {
      ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: id } }));
      heartbeat = setInterval(() => ws.readyState === 1 && ws.send(JSON.stringify({ op: 3 })), msg.d.heartbeat_interval || 30000);
    } else if (msg.op === 0 && (msg.t === 'INIT_STATE' || msg.t === 'PRESENCE_UPDATE')) {
      publish(msg.d);
    }
  });
  ws.addEventListener('close', fail);
  ws.addEventListener('error', fail);
}

export async function initLive() {
  let profile;
  try { profile = await loadData('profile'); } catch { return; }
  const id = profile.discordId;
  if (!id) return;

  let pollTimer = null;
  const startPolling = () => {
    if (pollTimer) return;
    poll(id);
    pollTimer = setInterval(() => !document.hidden && poll(id), 30000);
  };

  // Try the socket; if it drops, poll and retry the socket every couple of minutes.
  const trySocket = () => connectSocket(id, () => {
    startPolling();
    setTimeout(() => { if (navigator.onLine) trySocket(); }, 120000);
  });
  trySocket();
  poll(id); // immediate first paint while the socket handshakes
}

// Small formatting helpers for UI code
export function describe(p) {
  if (!p) return null;
  if (p.spotify) return { icon: '🎧', text: `Listening to ${p.spotify.song} — ${p.spotify.artist}` };
  if (p.game) return { icon: '🎮', text: `Playing ${p.game.name}${p.game.details ? ` · ${p.game.details}` : ''}` };
  if (p.custom?.text) return { icon: p.custom.emoji || '💬', text: p.custom.text };
  return { icon: '', text: STATUS[p.status]?.label || p.status };
}

export function elapsed(since) {
  if (!since) return '';
  const m = Math.floor((Date.now() - since) / 60000);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}
