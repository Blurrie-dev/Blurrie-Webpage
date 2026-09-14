// Quiz: "How well do you know Hudson?", plus Hot Takes and Random Fact tabs.
// All content lives in data/quiz.json.

import { loadData } from '../data.js';
import { esc } from '../ui.js';

const shuffle = (arr) => arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);

export default {
  id: 'quiz',
  title: 'Quiz',
  icon: '❓',
  size: { w: 540, h: 480 },

  async mount(root, ctx) {
    root.classList.add('no-pad');
    root.innerHTML = '<p class="muted" style="padding:12px">Loading…</p>';
    const data = await loadData('quiz');

    root.innerHTML = `
      <div class="tabs">
        <div class="tab-strip" role="tablist">
          <button role="tab" aria-selected="true" data-tab="quiz">Quiz</button>
          <button role="tab" aria-selected="false" data-tab="takes">Hot Takes</button>
          <button role="tab" aria-selected="false" data-tab="facts">Random Fact</button>
        </div>
        <div class="tab-panel" id="tab-quiz" role="tabpanel"></div>
        <div class="tab-panel" id="tab-takes" role="tabpanel" hidden></div>
        <div class="tab-panel" id="tab-facts" role="tabpanel" hidden></div>
      </div>`;

    root.querySelector('.tab-strip').addEventListener('click', (e) => {
      const tab = e.target.closest('[data-tab]');
      if (!tab) return;
      ctx.sfx.play('click');
      root.querySelectorAll('[role="tab"]').forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
      root.querySelectorAll('.tab-panel').forEach((p) => { p.hidden = p.id !== `tab-${tab.dataset.tab}`; });
    });

    mountQuiz(root.querySelector('#tab-quiz'), data, ctx);
    mountTakes(root.querySelector('#tab-takes'), data.hotTakes || [], ctx);
    mountFacts(root.querySelector('#tab-facts'), data.facts || [], ctx);
    ctx.setStatus(`${(data.questions || []).length} questions · ${(data.hotTakes || []).length} hot takes · ${(data.facts || []).length} facts`);
  },
};

// ---------- Quiz ----------
function mountQuiz(panel, data, ctx) {
  const questions = data.questions || [];
  const tiers = (data.tiers || []).slice().sort((a, b) => a.min - b.min);
  const best = ctx.store.get('quiz:best', null);
  let order = [], i = 0, score = 0;

  const intro = () => {
    panel.innerHTML = `
      <div class="quiz-intro">
        <div class="quiz-big" aria-hidden="true">❓</div>
        <h2>How well do you know Hudson?</h2>
        <p class="muted">${questions.length} questions. No Googling. Well — this site is the only source anyway.</p>
        ${best ? `<p class="muted">Your best: <b>${best.score}/${best.total}</b> — ${esc(best.tier)}</p>` : ''}
        <button class="btn" id="quiz-start">Start quiz</button>
      </div>`;
    panel.querySelector('#quiz-start').addEventListener('click', () => {
      order = shuffle(questions.map((_, n) => n)); i = 0; score = 0;
      ctx.sfx.play('click');
      ask();
    });
  };

  const ask = () => {
    const q = questions[order[i]];
    panel.innerHTML = `
      <div class="quiz-q">
        <div class="quiz-progress"><div style="width:${(i / questions.length) * 100}%"></div></div>
        <p class="muted">Question ${i + 1} of ${questions.length} · Score ${score}</p>
        <h3>${esc(q.q)}</h3>
        <div class="quiz-options">
          ${q.options.map((o, n) => `<button class="btn quiz-opt" data-n="${n}">${esc(o)}</button>`).join('')}
        </div>
        <p class="quiz-explain" id="quiz-explain" hidden></p>
      </div>`;
    panel.querySelector('.quiz-options').addEventListener('click', (e) => {
      const btn = e.target.closest('.quiz-opt');
      if (!btn || panel.querySelector('.quiz-opt[disabled]')) return;
      const n = +btn.dataset.n;
      const right = n === q.answer;
      if (right) score++;
      ctx.sfx.play(right ? 'toast' : 'error');
      panel.querySelectorAll('.quiz-opt').forEach((b) => {
        b.disabled = true;
        if (+b.dataset.n === q.answer) b.classList.add('correct');
        else if (b === btn) b.classList.add('wrong');
      });
      const ex = panel.querySelector('#quiz-explain');
      ex.hidden = false;
      ex.innerHTML = `${right ? '✅ Correct.' : '❌ Nope.'} ${esc(q.explain || '')} <button class="btn" id="quiz-next">${i + 1 < questions.length ? 'Next →' : 'See result'}</button>`;
      ex.querySelector('#quiz-next').addEventListener('click', () => { i++; i < questions.length ? ask() : result(); });
    });
  };

  const result = () => {
    const tier = tiers.filter((t) => score >= t.min).pop() || { label: 'Unranked', icon: '❔', blurb: '' };
    const prev = ctx.store.get('quiz:best', null);
    if (!prev || score > prev.score) ctx.store.set('quiz:best', { score, total: questions.length, tier: tier.label });
    const share = `I scored ${score}/${questions.length} on "How well do you know Hudson?" — ${tier.label} tier. ${location.origin}${location.pathname}#quiz`;
    panel.innerHTML = `
      <div class="quiz-intro">
        <div class="quiz-big" aria-hidden="true">${esc(tier.icon)}</div>
        <h2>${score} / ${questions.length}</h2>
        <h3>${esc(tier.label)}</h3>
        <p class="muted">${esc(tier.blurb)}</p>
        <div class="quiz-actions">
          <button class="btn" id="quiz-share">Copy result</button>
          <button class="btn" id="quiz-again">Try again</button>
        </div>
      </div>`;
    panel.querySelector('#quiz-again').addEventListener('click', intro);
    panel.querySelector('#quiz-share').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(share); ctx.toast('Result copied — go brag.', { icon: '📋' }); }
      catch { ctx.toast(share, { icon: '📋', duration: 8000 }); }
    });
  };

  intro();
}

// ---------- Hot Takes ----------
function mountTakes(panel, takes, ctx) {
  if (!takes.length) { panel.innerHTML = '<p class="muted">No hot takes yet. Suspicious.</p>'; return; }
  const votes = ctx.store.get('quiz:votes', {});
  let i = 0;
  const render = () => {
    const v = votes[i];
    panel.innerHTML = `
      <div class="takes">
        <p class="muted">Hot take ${i + 1} of ${takes.length}</p>
        <div class="take-card"><span aria-hidden="true">🔥</span><p>${esc(takes[i])}</p></div>
        <div class="quiz-actions">
          <button class="btn ${v === 'agree' ? 'pressed' : ''}" data-vote="agree">👍 Agree</button>
          <button class="btn ${v === 'disagree' ? 'pressed' : ''}" data-vote="disagree">👎 Disagree</button>
          <button class="btn" data-nav="next">Next take →</button>
        </div>
      </div>`;
  };
  panel.addEventListener('click', (e) => {
    const vote = e.target.closest('[data-vote]');
    const nav = e.target.closest('[data-nav]');
    if (vote) {
      votes[i] = vote.dataset.vote;
      ctx.store.set('quiz:votes', votes);
      ctx.sfx.play('click');
      ctx.toast(vote.dataset.vote === 'agree' ? 'Correct opinion. Noted.' : 'Noted. Wrong, but noted.', { icon: '📝' });
      render();
    } else if (nav) {
      i = (i + 1) % takes.length;
      ctx.sfx.play('click');
      render();
    }
  });
  render();
}

// ---------- Random Fact ----------
function mountFacts(panel, facts, ctx) {
  let bag = [];
  const next = () => {
    if (!bag.length) bag = shuffle(facts);
    return bag.pop();
  };
  panel.innerHTML = `
    <div class="facts">
      <div class="fact-card" id="fact-card"><span aria-hidden="true">💡</span><p id="fact-text">Press the button.</p></div>
      <button class="btn" id="fact-btn">Random fact</button>
      <p class="muted" id="fact-count"></p>
    </div>`;
  const text = panel.querySelector('#fact-text');
  const count = panel.querySelector('#fact-count');
  const card = panel.querySelector('#fact-card');
  let seen = 0;
  panel.querySelector('#fact-btn').addEventListener('click', () => {
    if (!facts.length) { text.textContent = 'No facts. Very mysterious.'; return; }
    ctx.sfx.play('click');
    text.textContent = next();
    seen++;
    count.textContent = `${Math.min(seen, facts.length)} of ${facts.length} facts seen${bag.length === 0 && seen >= facts.length ? ' — reshuffling' : ''}`;
    card.classList.remove('pop'); void card.offsetWidth; card.classList.add('pop');
  });
}
