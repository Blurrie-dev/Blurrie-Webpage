// AMA: a small chat window backed by Claude Haiku via worker/ (Cloudflare).
// Answers general questions and knows the facts on this site about Hudson.
// The endpoint lives in data/profile.json → assistant.endpoint.

import { loadData } from '../data.js';
import { esc } from '../ui.js';

const SUGGESTIONS = [
  'What does Hudson study?',
  'What has Hudson built?',
  'Explain how this website works',
  'Tell me a fun fact about space',
];

let abort = null;

export default {
  id: 'ask',
  title: 'AMA',
  icon: '✨',
  size: { w: 460, h: 520 },

  async mount(root, ctx) {
    root.classList.add('no-pad');
    const profile = await loadData('profile');
    const endpoint = profile.assistant?.endpoint;
    const history = []; // { role, content } — kept in memory for this window only

    root.innerHTML = `
      <div class="ask">
        <div class="ask-log" id="ask-log" aria-live="polite">
          <div class="ask-msg bot">
            <div class="ask-bubble">Ask me anything. I'm a small Claude model — I know the facts on this site about ${esc(profile.name || 'Hudson')}, and I can answer general questions too. I keep it short.</div>
          </div>
          <div class="ask-chips" id="ask-chips">
            ${SUGGESTIONS.map((s) => `<button class="ask-chip" data-q="${esc(s)}">${esc(s)}</button>`).join('')}
          </div>
        </div>
        <form class="ask-form" id="ask-form" autocomplete="off">
          <input id="ask-in" type="text" maxlength="500" placeholder="Ask me anything…" aria-label="Your question" ${endpoint ? '' : 'disabled'}>
          <button class="btn" id="ask-send" type="submit" ${endpoint ? '' : 'disabled'}>Send</button>
        </form>
        <p class="ask-foot muted">Claude Haiku 4.5 · facts about Hudson come from this site · can still be wrong</p>
      </div>`;

    const log = root.querySelector('#ask-log');
    const form = root.querySelector('#ask-form');
    const input = root.querySelector('#ask-in');
    const sendBtn = root.querySelector('#ask-send');
    const scroll = () => { log.scrollTop = log.scrollHeight; };

    if (!endpoint) {
      addBot('This app isn\'t connected yet — deploy the worker in <code>worker/</code> and put its URL in <code>data/profile.json → assistant.endpoint</code>.', true);
      return;
    }

    function addUser(text) {
      log.querySelector('#ask-chips')?.remove();
      const el = document.createElement('div');
      el.className = 'ask-msg user';
      el.innerHTML = `<div class="ask-bubble">${esc(text)}</div>`;
      log.appendChild(el);
      scroll();
    }

    function addBot(html, raw = false) {
      const el = document.createElement('div');
      el.className = 'ask-msg bot';
      el.innerHTML = `<div class="ask-bubble">${raw ? html : esc(html)}</div>`;
      log.appendChild(el);
      scroll();
      return el.querySelector('.ask-bubble');
    }

    // Render reply text, turning a trailing [[open:app]] tag into a button
    function renderReply(bubble, text) {
      const m = text.match(/\[\[open:([a-z]+)\]\]/);
      const clean = text.replace(/\s*\[\[open:[a-z]+\]\]\s*/g, '').trim();
      bubble.textContent = clean;
      if (m) {
        const btn = document.createElement('button');
        btn.className = 'btn ask-open';
        btn.textContent = `Open ${m[1]} →`;
        btn.addEventListener('click', () => ctx.openApp(m[1]));
        bubble.appendChild(btn);
      }
      return clean;
    }

    async function ask(question) {
      const q = question.trim();
      if (!q || abort) return;
      addUser(q);
      history.push({ role: 'user', content: q });
      input.value = '';
      input.disabled = sendBtn.disabled = true;

      const bubble = addBot('');
      bubble.classList.add('typing');
      let text = '';
      abort = new AbortController();

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history.slice(-8) }),
          signal: abort.signal,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = '';
        let usage = null;
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const events = buf.split('\n\n');
          buf = events.pop();
          for (const ev of events) {
            const line = ev.split('\n').find((l) => l.startsWith('data: '));
            if (!line) continue;
            const msg = JSON.parse(line.slice(6));
            if (msg.text) { text += msg.text; bubble.textContent = text.replace(/\[\[open:[a-z]*\]?\]?$/, ''); scroll(); }
            if (msg.error) throw new Error(msg.error);
            if (msg.done) usage = msg.usage;
          }
        }
        bubble.classList.remove('typing');
        const clean = renderReply(bubble, text || '…');
        history.push({ role: 'assistant', content: clean });
      } catch (err) {
        bubble.classList.remove('typing');
        bubble.classList.add('error');
        bubble.textContent = err.name === 'AbortError' ? 'Cancelled.' : (err.message || 'Something went wrong.');
        history.pop(); // don't keep a question that got no answer
        ctx.sfx.play('error');
      } finally {
        abort = null;
        input.disabled = sendBtn.disabled = false;
        input.focus();
        scroll();
      }
    }

    form.addEventListener('submit', (e) => { e.preventDefault(); ask(input.value); });
    log.addEventListener('click', (e) => {
      const chip = e.target.closest('.ask-chip');
      if (chip) { ctx.sfx.play('click'); ask(chip.dataset.q); }
    });
    setTimeout(() => input.focus(), 50);
    if (ctx.param) ask(ctx.param);
  },

  unmount() {
    abort?.abort();
    abort = null;
  },
};
