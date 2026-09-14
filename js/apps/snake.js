// Snake. Unlocked by the Konami code. Arrows / WASD / swipe / on-screen pad.

const GRID = 20;
const DIRS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] };

let game = null;

export default {
  id: 'snake',
  title: 'Snake',
  icon: '🐍',
  size: { w: 420, h: 520 },
  secret: true, // hidden from desktop/start until unlocked via Konami

  mount(root, ctx) {
    root.classList.add('no-pad');
    root.tabIndex = 0;
    root.innerHTML = `
      <div class="snake">
        <div class="snake-hud mono">
          <span>SCORE <b id="sn-score">0</b></span>
          <span>BEST <b id="sn-best">${ctx.store.get('snake:best', 0)}</b></span>
          <span id="sn-state">press any arrow to start</span>
        </div>
        <div class="snake-board"><canvas id="sn-canvas" width="400" height="400"></canvas></div>
        <div class="snake-pad" aria-label="Controls">
          <button data-dir="ArrowUp" aria-label="Up">▲</button>
          <button data-dir="ArrowLeft" aria-label="Left">◀</button>
          <button data-dir="ArrowDown" aria-label="Down">▼</button>
          <button data-dir="ArrowRight" aria-label="Right">▶</button>
        </div>
      </div>`;

    const canvas = root.querySelector('#sn-canvas');
    const cx = canvas.getContext('2d');
    const scoreEl = root.querySelector('#sn-score');
    const bestEl = root.querySelector('#sn-best');
    const stateEl = root.querySelector('#sn-state');

    const g = game = {
      snake: [[10, 10], [9, 10], [8, 10]], dir: [1, 0], next: [1, 0], food: null,
      score: 0, alive: true, running: false, timer: null, speed: 140,
    };

    const placeFood = () => {
      do { g.food = [Math.floor(Math.random() * GRID), Math.floor(Math.random() * GRID)]; }
      while (g.snake.some(([x, y]) => x === g.food[0] && y === g.food[1]));
    };
    placeFood();

    const draw = () => {
      const size = canvas.width / GRID;
      cx.fillStyle = '#0b1220';
      cx.fillRect(0, 0, canvas.width, canvas.height);
      cx.strokeStyle = 'rgba(255,255,255,.04)';
      for (let i = 0; i <= GRID; i++) {
        cx.beginPath(); cx.moveTo(i * size, 0); cx.lineTo(i * size, canvas.height); cx.stroke();
        cx.beginPath(); cx.moveTo(0, i * size); cx.lineTo(canvas.width, i * size); cx.stroke();
      }
      cx.fillStyle = '#ff5f57';
      cx.beginPath(); cx.arc((g.food[0] + .5) * size, (g.food[1] + .5) * size, size * .38, 0, Math.PI * 2); cx.fill();
      g.snake.forEach(([x, y], i) => {
        cx.fillStyle = i === 0 ? '#7cf5c8' : `hsl(160, 70%, ${Math.max(28, 55 - i * 1.5)}%)`;
        cx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
      });
      if (!g.alive) {
        cx.fillStyle = 'rgba(0,0,0,.6)'; cx.fillRect(0, 0, canvas.width, canvas.height);
        cx.fillStyle = '#fff'; cx.font = 'bold 28px system-ui'; cx.textAlign = 'center';
        cx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 8);
        cx.font = '14px system-ui'; cx.fillText('press space or any arrow to restart', canvas.width / 2, canvas.height / 2 + 20);
      }
    };

    const step = () => {
      g.dir = g.next;
      const head = [g.snake[0][0] + g.dir[0], g.snake[0][1] + g.dir[1]];
      const hitWall = head[0] < 0 || head[1] < 0 || head[0] >= GRID || head[1] >= GRID;
      const hitSelf = g.snake.some(([x, y]) => x === head[0] && y === head[1]);
      if (hitWall || hitSelf) {
        g.alive = false; g.running = false; clearInterval(g.timer);
        stateEl.textContent = 'game over';
        ctx.sfx.play('error');
        if (g.score > ctx.store.get('snake:best', 0)) { ctx.store.set('snake:best', g.score); bestEl.textContent = g.score; ctx.toast(`New high score: ${g.score}`, { icon: '🐍' }); }
        draw();
        return;
      }
      g.snake.unshift(head);
      if (head[0] === g.food[0] && head[1] === g.food[1]) {
        g.score++;
        scoreEl.textContent = g.score;
        ctx.sfx.play('click');
        if (g.score % 5 === 0 && g.speed > 60) { g.speed -= 12; clearInterval(g.timer); g.timer = setInterval(step, g.speed); }
        placeFood();
      } else {
        g.snake.pop();
      }
      draw();
    };

    const reset = () => {
      Object.assign(g, { snake: [[10, 10], [9, 10], [8, 10]], dir: [1, 0], next: [1, 0], score: 0, alive: true, running: false, speed: 140 });
      clearInterval(g.timer);
      scoreEl.textContent = '0';
      placeFood();
      draw();
    };

    const start = () => {
      if (g.running) return;
      g.running = true;
      stateEl.textContent = 'go!';
      clearInterval(g.timer);
      g.timer = setInterval(step, g.speed);
    };

    const turn = (key) => {
      const d = DIRS[key];
      if (!d) return false;
      if (!g.alive) reset();
      // No 180° turns
      if (d[0] === -g.dir[0] && d[1] === -g.dir[1] && g.snake.length > 1) return true;
      g.next = d;
      start();
      return true;
    };

    root.addEventListener('keydown', (e) => {
      if (e.key === ' ') { e.preventDefault(); if (!g.alive) { reset(); return; } g.running ? (clearInterval(g.timer), g.running = false, stateEl.textContent = 'paused') : start(); return; }
      if (turn(e.key.length === 1 ? e.key.toLowerCase() : e.key)) e.preventDefault();
    });
    root.querySelector('.snake-pad').addEventListener('click', (e) => {
      const b = e.target.closest('[data-dir]');
      if (b) { turn(b.dataset.dir); root.focus(); }
    });
    // Swipe
    let touch = null;
    canvas.addEventListener('touchstart', (e) => { touch = [e.touches[0].clientX, e.touches[0].clientY]; }, { passive: true });
    canvas.addEventListener('touchend', (e) => {
      if (!touch) return;
      const dx = e.changedTouches[0].clientX - touch[0], dy = e.changedTouches[0].clientY - touch[1];
      if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
      turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'ArrowRight' : 'ArrowLeft') : (dy > 0 ? 'ArrowDown' : 'ArrowUp'));
      touch = null;
    });
    root.addEventListener('pointerdown', () => root.focus());

    draw();
    setTimeout(() => root.focus(), 50);
    ctx.setStatus('Arrows / WASD to move · space to pause · eat the red dots');
  },

  unmount() {
    if (game) clearInterval(game.timer);
    game = null;
  },
};
