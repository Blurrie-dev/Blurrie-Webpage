// Terminal: a fake shell for people who would rather type. Tab-completes,
// remembers history, and has exactly the amount of sudo you'd expect.

import { loadData } from '../data.js';
import { esc } from '../ui.js';
import { apps } from './registry.js';
import { THEMES, applyTheme, currentTheme } from '../theme.js';
import { bsod } from '../gimmicks/bsod.js';
import { isUnlocked } from '../gimmicks/konami.js';

const BOOTED_AT = Date.now();
const LOGO = [
  '  _   _ _   _ ____   ____   ___  _   _ ',
  ' | | | | | | |  _ \\ / ___| / _ \\| \\ | |',
  ' | |_| | | | | | | |\\___ \\| | | |  \\| |',
  ' |  _  | |_| | |_| | ___) | |_| | |\\  |',
  ' |_| |_|\\___/|____/ |____/ \\___/|_| \\_|',
];

function uptime() {
  const s = Math.floor((Date.now() - BOOTED_AT) / 1000);
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export default {
  id: 'terminal',
  title: 'Terminal',
  icon: '🖥️',
  size: { w: 640, h: 420 },

  async mount(root, ctx) {
    root.classList.add('no-pad');
    root.innerHTML = `
      <div class="term">
        <div class="term-out" id="term-out"></div>
        <form class="term-line" id="term-form" autocomplete="off">
          <span class="term-prompt">visitor@hudsonos:~$</span>
          <input class="term-in" id="term-in" type="text" spellcheck="false" autocapitalize="off" aria-label="Command">
        </form>
      </div>`;
    const out = root.querySelector('#term-out');
    const form = root.querySelector('#term-form');
    const input = root.querySelector('#term-in');
    const profile = await loadData('profile').catch(() => ({}));
    const history = [];
    let hIdx = -1;

    const print = (text = '', cls = '') => {
      const line = document.createElement('div');
      line.className = `term-row ${cls}`;
      line.innerHTML = text;
      out.appendChild(line);
      out.scrollTop = out.scrollHeight;
    };
    const echo = (cmd) => print(`<span class="term-prompt">visitor@hudsonos:~$</span> ${esc(cmd)}`, 'term-echo');
    const visibleApps = () => apps.filter((a) => a.start !== false && (!a.secret || isUnlocked(a.id)));

    const COMMANDS = {
      help: { desc: 'list commands', run: () => {
        print('Available commands:');
        Object.entries(COMMANDS).filter(([, c]) => !c.hidden).forEach(([k, c]) => print(`  <b>${k.padEnd(12)}</b> ${esc(c.desc)}`));
        print('Tab completes. Arrow keys recall history.');
      } },
      about: { desc: 'who is this', run: () => {
        print(`<b>${esc(profile.name || 'Hudson')}</b> — ${esc(profile.tagline || '')}`);
        (profile.bio || []).forEach((p) => print(esc(p)));
        (profile.roles || []).forEach((r) => print(`  ${esc(r.icon)} ${esc(r.title)} — ${esc(r.detail || '')}`));
      } },
      socials: { desc: 'where to find me', run: () => {
        (profile.socials || []).forEach((s) => print(`  ${esc(s.label.padEnd(9))} <a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.handle || s.url)}</a>`));
      } },
      projects: { desc: 'list projects', run: async () => {
        const list = await loadData('projects');
        list.forEach((p) => print(`  ${esc(p.icon || '📁')} <b>${esc(p.name)}</b> (${p.year || '?'}) — ${esc(p.tagline || '')}  <span class="muted">open projects/${esc(p.id)}</span>`));
      } },
      ls: { desc: 'list apps', run: () => print(visibleApps().map((a) => `<span class="term-file">${esc(a.id)}.exe</span>`).join('  ')) },
      open: { desc: 'open <app> — e.g. open projects/hudsonos', run: (args) => {
        const [id, param] = (args[0] || '').replace(/\.exe$/, '').split('/');
        if (!id) return print('usage: open <app>[/<item>]', 'term-err');
        if (!apps.some((a) => a.id === id)) return print(`open: ${esc(id)}: no such app`, 'term-err');
        ctx.openApp(id, { param: param || null });
        print(`Opening ${esc(id)}.exe…`);
      } },
      theme: { desc: 'theme [name] — switch theme', run: (args) => {
        if (!args[0]) return print(`Current: <b>${currentTheme()}</b>. Available: ${THEMES.map((t) => t.id).join(', ')}`);
        if (!THEMES.some((t) => t.id === args[0])) return print(`theme: unknown theme "${esc(args[0])}"`, 'term-err');
        applyTheme(args[0]);
        print(`Theme set to ${esc(args[0])}.`);
      } },
      neofetch: { desc: 'system info, but pretty', run: () => {
        const info = [
          `<b>visitor</b>@<b>hudsonos</b>`, '-----------------',
          `<b>OS:</b> HudsonOS 0.4 x86_64`, `<b>Host:</b> ${esc(navigator.platform || 'browser')}`,
          `<b>Kernel:</b> vanilla-js`, `<b>Uptime:</b> ${uptime()}`,
          `<b>Shell:</b> fake.sh`, `<b>Resolution:</b> ${innerWidth}x${innerHeight}`,
          `<b>WM:</b> wm.js`, `<b>Theme:</b> ${currentTheme()}`,
          `<b>Windows:</b> ${document.querySelectorAll('.window').length} open`,
        ];
        const rows = Math.max(LOGO.length, info.length);
        for (let i = 0; i < rows; i++) print(`<span class="term-logo">${esc(LOGO[i] || ' '.repeat(40))}</span>   ${info[i] || ''}`, 'term-pre');
        print(`<span class="term-swatch">${['#ff5f57', '#febc2e', '#28c840', '#0078d7', '#c86dd7', '#00e5c8', '#fff', '#888'].map((c) => `<i style="background:${c}"></i>`).join('')}</span>`);
      } },
      ask: { desc: 'ask <question> — ask AMA (Claude) anything', run: (args) => { ctx.openApp('ask', { param: args.join(' ') || null }); print('Opening AMA…'); } },
      whoami: { desc: 'who are you', run: () => print('visitor. Nice to meet you.') },
      date: { desc: 'current date', run: () => print(esc(new Date().toString())) },
      echo: { desc: 'echo <text>', run: (args) => print(esc(args.join(' '))) },
      history: { desc: 'command history', run: () => history.forEach((h, i) => print(`  ${String(i + 1).padStart(3)}  ${esc(h)}`)) },
      clear: { desc: 'clear the screen', run: () => { out.innerHTML = ''; } },
      exit: { desc: 'close the terminal', run: () => ctx.close() },
      sudo: { desc: 'you wish', run: () => { print('visitor is not in the sudoers file. This incident will be reported.', 'term-err'); } },
      snake: { hidden: true, run: () => isUnlocked('snake') ? ctx.openApp('snake') : print('snake: command not found… yet. Try a cheat code.', 'term-err') },
      cat: { hidden: true, run: (args) => args[0] ? print(`cat: ${esc(args[0])}: Permission denied. It's personal.`, 'term-err') : print('usage: cat <file>') },
      cd: { hidden: true, run: () => print("There's nowhere else to go.") },
      pwd: { hidden: true, run: () => print('/home/visitor') },
      vim: { hidden: true, run: () => print('You are now trapped in vim. Just kidding — you can still close the window.') },
      rm: { hidden: true, run: async (args) => {
        const a = args.join(' ');
        if (!/-rf?\s*\/|--no-preserve-root/.test(a) && !/^-rf\s+\*/.test(a)) return print(`rm: cannot remove '${esc(a || '')}': Permission denied`, 'term-err');
        const files = ['/bin', '/boot', '/etc', '/home/hudson/projects', '/home/hudson/hobbies', '/usr', '/var', '/sys/personality', '/dev/cats'];
        for (const f of files) { print(`removing ${esc(f)}…`, 'term-err'); await new Promise((r) => setTimeout(r, 140)); }
        print('rm: cannot remove \'/sys/personality\': Device or resource busy', 'term-err');
        await new Promise((r) => setTimeout(r, 600));
        bsod('CRITICAL_PROCESS_DIED', 'personality.sys');
      } },
    };

    print(`HudsonOS fake.sh — type <b>help</b> to get started.`, 'muted');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const raw = input.value.trim();
      input.value = '';
      hIdx = -1;
      echo(raw);
      if (!raw) return;
      history.push(raw);
      const [cmd, ...args] = raw.split(/\s+/);
      const c = COMMANDS[cmd.toLowerCase()];
      if (!c) { ctx.sfx.play('error'); return print(`bash: ${esc(cmd)}: command not found`, 'term-err'); }
      try { await c.run(args); } catch (err) { print(`error: ${esc(err.message)}`, 'term-err'); }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') { e.preventDefault(); if (history.length) { hIdx = hIdx < 0 ? history.length - 1 : Math.max(0, hIdx - 1); input.value = history[hIdx]; } }
      else if (e.key === 'ArrowDown') { e.preventDefault(); if (hIdx >= 0) { hIdx = hIdx + 1 >= history.length ? -1 : hIdx + 1; input.value = hIdx < 0 ? '' : history[hIdx]; } }
      else if (e.key === 'Tab') {
        e.preventDefault();
        const parts = input.value.split(/\s+/);
        const pool = parts.length > 1 ? visibleApps().map((a) => a.id) : Object.keys(COMMANDS).filter((k) => !COMMANDS[k].hidden);
        const frag = parts[parts.length - 1];
        const matches = pool.filter((p) => p.startsWith(frag));
        if (matches.length === 1) { parts[parts.length - 1] = matches[0]; input.value = parts.join(' ') + (parts.length === 1 ? ' ' : ''); }
        else if (matches.length > 1) print(matches.join('  '), 'muted');
      }
      else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); out.innerHTML = ''; }
      else if (e.key === 'c' && e.ctrlKey) { e.preventDefault(); echo(input.value + '^C'); input.value = ''; }
    });

    root.addEventListener('pointerup', () => { if (!getSelection().toString()) input.focus(); });
    setTimeout(() => input.focus(), 50);
  },
};
