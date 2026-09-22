// Text effects. Every effect:
//   - takes an element and { speed, instant }
//   - removes the element's `pending` class when it starts
//   - returns a Promise that resolves once the final text is in place
//   - bails out to the final state if motion is switched off mid-animation

export const motion = { enabled: true };

const NOISE = '!<>-_\\/[]{}=+*^?#%&@$01';
const SHADES = '░▒▓'; // ░▒▓
const pick = (set) => set[(Math.random() * set.length) | 0];
const frame = () => new Promise((r) => requestAnimationFrame(r));
const now = () => performance.now();
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const isSpace = (ch) => /\s/.test(ch);

/** Collect non-empty text nodes under root, skipping any nested `exclude` containers. */
function textNodes(root, exclude) {
  const out = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      if (!n.data.trim()) return NodeFilter.FILTER_REJECT;
      if (exclude) {
        const ex = n.parentElement.closest(exclude);
        if (ex && ex !== root && root.contains(ex)) return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  while (walker.nextNode()) out.push(walker.currentNode);
  return out;
}

/* -------------------------------------------------------------------------- */
/* Scramble: every character starts as noise and locks in roughly left→right. */
/* -------------------------------------------------------------------------- */

export async function scramble(el, { speed = 1, instant = false, duration } = {}) {
  el.classList.remove('pending');
  if (instant || !motion.enabled || el.dataset.busy) return;
  el.dataset.busy = '1';

  const nodes = textNodes(el);
  const finals = nodes.map((n) => Array.from(n.data));
  const total = finals.reduce((a, s) => a + s.length, 0) || 1;
  const D = (duration ?? clamp(total * 28, 450, 1100)) / speed;

  let offset = 0;
  const lockAt = finals.map((chars) => {
    const t = chars.map((_, i) => ((offset + i) / total) * D * 0.65 + Math.random() * D * 0.35);
    offset += chars.length;
    return t;
  });

  const start = now();
  for (;;) {
    const t = now() - start;
    if (t >= D || !motion.enabled) break;
    nodes.forEach((n, k) => {
      n.data = finals[k].map((ch, i) => (isSpace(ch) || t >= lockAt[k][i] ? ch : pick(NOISE))).join('');
    });
    await frame();
  }
  nodes.forEach((n, k) => (n.data = finals[k].join('')));
  delete el.dataset.busy;
}

/* -------------------------------------------------------------------------- */
/* Typewriter: text is laid out invisibly first, then revealed with a cursor.  */
/* A short band of noise runs ahead of the cursor like a print head.           */
/* -------------------------------------------------------------------------- */

export async function typewriter(el, { speed = 1, instant = false, exclude } = {}) {
  el.classList.remove('pending');
  if (instant || !motion.enabled) return;

  const nodes = textNodes(el, exclude);
  if (!nodes.length) return;

  // Replace each text node with [typed][noise][ghost] so layout never shifts.
  const parts = nodes.map((n) => {
    const typed = document.createTextNode('');
    const noise = document.createElement('span');
    const ghost = document.createElement('span');
    noise.className = 'tw-noise';
    ghost.className = 'tw-ghost';
    ghost.textContent = n.data;
    n.replaceWith(typed, noise, ghost);
    return { n, s: n.data, typed, noise, ghost, shown: -1 };
  });

  let offset = 0;
  for (const p of parts) {
    p.o = offset;
    offset += p.s.length;
  }
  const N = offset;
  const D = clamp(N * 9, 280, 1800) / speed;
  const BAND = 3;

  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  cursor.setAttribute('aria-hidden', 'true');

  const start = now();
  for (;;) {
    const t = now() - start;
    if (t >= D || !motion.enabled) break;
    const k = Math.floor((t / D) * N);
    for (const p of parts) {
      const local = clamp(k - p.o, 0, p.s.length);
      const frontier = k >= p.o && k < p.o + p.s.length;
      if (local === p.shown && !frontier) continue;
      p.shown = local;
      p.typed.data = p.s.slice(0, local);
      const band = frontier ? p.s.slice(local, local + BAND) : '';
      p.noise.textContent = Array.from(band, (ch) => (isSpace(ch) ? ch : pick(NOISE))).join('');
      p.ghost.textContent = p.s.slice(local + band.length);
      if (frontier && cursor.previousSibling !== p.typed) p.typed.after(cursor);
    }
    await frame();
  }

  cursor.remove();
  for (const p of parts) {
    p.typed.replaceWith(p.n);
    p.noise.remove();
    p.ghost.remove();
  }
}

/* -------------------------------------------------------------------------- */
/* Print: ASCII art is swept in diagonally, shaded glyphs at the leading edge. */
/* -------------------------------------------------------------------------- */

export async function printArt(pre, { speed = 1, instant = false, shades = false } = {}) {
  pre.classList.remove('pending');
  const final = pre.dataset.final ?? pre.textContent;
  pre.dataset.final = final;
  if (instant || !motion.enabled) {
    pre.textContent = final;
    return;
  }

  const lines = final.split('\n');
  const W = Math.max(...lines.map((l) => l.length));
  const grid = lines.map((l) => Array.from(l.padEnd(W, ' ')));
  const R = grid.length;
  const inkCount = final.replace(/\s/g, '').length;
  const D = clamp(inkCount * 2.2, 700, 2400) / speed;
  const EDGE = 0.1; // fraction of the sweep drawn as noise before a cell resolves
  const noise = shades ? SHADES : NOISE;

  const start = now();
  for (;;) {
    const t = (now() - start) / D;
    if (t >= 1 + EDGE || !motion.enabled) break;
    let out = '';
    for (let r = 0; r < R; r++) {
      for (let c = 0; c < W; c++) {
        const ch = grid[r][c];
        const at = ((c + r * 2) / (W + R * 2)) * 1; // 0..1 diagonal position
        if (ch === ' ' || t >= at + EDGE) out += ch;
        else if (t >= at) out += pick(noise);
        else out += ' ';
      }
      if (r < R - 1) out += '\n';
    }
    pre.textContent = out;
    await frame();
  }
  pre.textContent = final;
}

/* -------------------------------------------------------------------------- */
/* Lines: children with `.line` appear one after another, like a line printer. */
/* -------------------------------------------------------------------------- */

export async function lines(el, { speed = 1, instant = false } = {}) {
  const rows = Array.from(el.querySelectorAll('.line'));
  el.classList.remove('pending');
  if (instant || !motion.enabled) {
    rows.forEach((r) => r.classList.remove('off'));
    return;
  }
  rows.forEach((r) => r.classList.add('off'));
  const step = clamp(900 / rows.length, 22, 70) / speed;
  for (const row of rows) {
    if (!motion.enabled) break;
    row.classList.remove('off');
    row.classList.add('fresh');
    const code = row.querySelector('.code') || row;
    // Resolve each fresh line through a quick scramble.
    scramble(code, { duration: 160 / speed });
    await new Promise((r) => setTimeout(r, step));
  }
  rows.forEach((r) => r.classList.remove('off'));
}

/* -------------------------------------------------------------------------- */
/* Fade: for images, rules and tables, handled mostly in CSS.                  */
/* -------------------------------------------------------------------------- */

export async function fade(el, { speed = 1, instant = false } = {}) {
  el.classList.remove('pending');
  if (instant || !motion.enabled) return;
  el.classList.add('fade-in');
  await new Promise((r) => setTimeout(r, 240 / speed));
}
