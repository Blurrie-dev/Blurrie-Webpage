# hudsonos-ask — the "Ask Hudson" backend

A Cloudflare Worker that proxies the site's chat window to Claude Haiku 4.5.
It holds the API key, builds a compact fact sheet from `data/*.json`, caps
every reply at 300 tokens, and rate-limits callers (10 requests / minute / IP).

Cost: ~800 input + ~150 output tokens per message ≈ **$0.002**. Cloudflare's
free plan covers 100k requests/day.

## Deploy (once, ~5 minutes)

1. Create a free account at <https://dash.cloudflare.com> and get an Anthropic
   API key at <https://console.anthropic.com>.
2. From this folder:

   ```bash
   npm install
   npx wrangler login              # opens the browser
   npx wrangler secret put ANTHROPIC_API_KEY   # paste the key when prompted
   npx wrangler deploy
   ```

   The last command prints the URL, e.g. `https://hudsonos-ask.<you>.workers.dev`.
3. Put `https://hudsonos-ask.<you>.workers.dev/chat` into `data/profile.json`
   under `assistant.endpoint`, commit, push. The desktop icon starts working.

Re-run `npx wrangler deploy` whenever you change `src/index.js`. The fact
sheet is fetched from the live site (`SITE_ORIGIN` in `wrangler.toml`) and
cached for 10 minutes, so editing `data/*.json` on the site is enough; the
copies bundled at deploy time are only a fallback.

## Local development

```bash
echo "ANTHROPIC_API_KEY=sk-ant-..." > .dev.vars   # gitignored
npx wrangler dev
```

then set `assistant.endpoint` to `http://localhost:8787/chat` while testing.

## Knobs (`src/index.js`)

`MODEL`, `MAX_OUTPUT_TOKENS`, `MAX_TURNS`, `MAX_MESSAGE_CHARS`; the rate limit
and allowed origins live in `wrangler.toml`.
