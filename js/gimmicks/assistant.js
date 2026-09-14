// "Clip", a paperclip who offers context-sensitive tips. Each tip shows once
// per session; "Stop helping" disables it for good (re-enable in Settings).

import { store } from '../store.js';
import { esc } from '../ui.js';

const TIPS = {
  welcome:     { when: 'idle', text: 'Hi! I\'m Clip. It looks like you\'re on a desktop. Double-click an icon to open it, or press Start.', mobile: 'Hi! I\'m Clip. Tap an icon to open it, or press the Start button.' },
  about:       { when: 'open', text: 'It looks like you\'re reading my bio. Fair warning: the Quiz will test you on this later.' },
  projects:    { when: 'open', text: 'Every project here has its own link. Try sharing #projects/hudsonos.' },
  games:       { when: 'open', text: 'Those hours are real. Judgement is optional.' },
  music:       { when: 'open', text: 'It won\'t actually play. Press ▶ and it opens the album for you instead.' },
  quiz:        { when: 'open', text: 'No cheating. Okay, the About Me window is not technically cheating.' },
  terminal:    { when: 'open', text: 'Type help to see what I know. Type rm -rf / to see what I don\'t survive.' },
  timeline:    { when: 'open', text: 'Drag the slider at the top to travel through time. No DeLorean required.' },
  contact:     { when: 'open', text: 'Discord is fastest. There\'s a copy button so you don\'t typo the underscores.' },
};

const CLIP_SVG = `
  <svg viewBox="0 0 48 64" width="44" height="58" aria-hidden="true">
    <path d="M30 6a10 10 0 0 1 10 10v30a12 12 0 0 1-24 0V20a7 7 0 0 1 14 0v24a2 2 0 0 1-4 0V22" fill="none" stroke="#6b7280" stroke-width="3.5" stroke-linecap="round"/>
    <ellipse cx="22" cy="20" rx="3.2" ry="4" fill="#fff" stroke="#111" stroke-width="1"/>
    <ellipse cx="32" cy="20" rx="3.2" ry="4" fill="#fff" stroke="#111" stroke-width="1"/>
    <circle class="clip-eye" cx="23" cy="21" r="1.4" fill="#111"/>
    <circle class="clip-eye" cx="33" cy="21" r="1.4" fill="#111"/>
    <path d="M18 12q4-4 8 0M28 12q4-4 8 0" fill="none" stroke="#111" stroke-width="1.4" stroke-linecap="round"/>
  </svg>`;

let el = null;
let hideTimer = null;

export const assistantEnabled = () => store.get('assistant', true);
export function setAssistantEnabled(on) { store.set('assistant', !!on); if (!on) hide(); }

function shown(id) { return store.session.get('tips-shown', []).includes(id); }
function markShown(id) { store.session.set('tips-shown', [...store.session.get('tips-shown', []), id]); }

function hide() {
  clearTimeout(hideTimer);
  if (!el) return;
  el.classList.add('leaving');
  const dead = el;
  el = null;
  setTimeout(() => dead.remove(), 300);
}

function show(id) {
  const tip = TIPS[id];
  if (!tip || !assistantEnabled() || shown(id) || el) return;
  markShown(id);
  const text = (tip.mobile && matchMedia('(pointer: coarse)').matches) ? tip.mobile : tip.text;
  el = document.createElement('div');
  el.className = 'clip';
  el.innerHTML = `
    <div class="clip-bubble" role="status">
      <p>${esc(text)}</p>
      <div class="clip-actions">
        <button class="btn" data-act="ok">Got it</button>
        <button class="btn" data-act="never">Stop helping</button>
      </div>
    </div>
    <div class="clip-char">${CLIP_SVG}</div>`;
  el.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'never') setAssistantEnabled(false);
    if (act) hide();
  });
  document.body.appendChild(el);
  clearTimeout(hideTimer);
  hideTimer = setTimeout(hide, 14_000);
}

export function initAssistant({ wm }) {
  // Welcome tip if the visitor hasn't opened anything a few seconds in
  setTimeout(() => { if (!document.querySelector('.window')) show('welcome'); }, 4000);

  wm.addEventListener('open', (e) => {
    const id = e.detail.id;
    setTimeout(() => show(id), 1800);
  });
}
