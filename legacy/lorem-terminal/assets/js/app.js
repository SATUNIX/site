import { renderBannerLines } from './ascii-font.js';
import { motion, scramble, typewriter, printArt, lines, fade } from './effects.js';

const $ = (sel, root = document) => root.querySelector(sel);
const root = document.documentElement;

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
};

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
motion.enabled = !reducedMotion && root.dataset.motion !== 'off';

/* ------------------------------ helpers ------------------------------ */

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const slugify = (s) =>
  s.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-') || 'section';

const pad = (n, w = 2) => String(n).padStart(w, '0');

/** Split `---\nkey: value\n---` front matter from the markdown body. */
function parseFrontMatter(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { meta: {}, body: src };
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i < 0) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (val === 'true') val = true;
    else if (val === 'false') val = false;
    meta[key] = val;
  }
  return { meta, body: src.slice(m[0].length) };
}

async function loadPages() {
  try {
    const res = await fetch('content/pages.json', { cache: 'no-cache' });
    if (res.ok) return await res.json();
  } catch { /* fall through */ }
  return [{ slug: 'home', title: 'Home', nav: true }];
}

async function loadMarkdown(slug) {
  try {
    const res = await fetch(`content/${slug}.md`, { cache: 'no-cache' });
    if (res.ok) return { src: await res.text(), ok: true };
  } catch { /* fall through */ }
  return {
    ok: false,
    src: `---\ntitle: Not found\nbanner: 404\nsubtitle: The requested file could not be located.\n---\n\n` +
      `No file named \`${slug}.md\` exists in \`content/\`.\n\n[Return home](home.md)\n`,
  };
}

/* ------------------------------ chrome ------------------------------ */

function renderNav(pages, current) {
  const nav = $('#nav');
  nav.innerHTML = pages
    .filter((p) => p.nav !== false)
    .map((p) => {
      const cur = p.slug === current ? ' aria-current="page"' : '';
      return `<a href="?p=${encodeURIComponent(p.slug)}"${cur} data-scramble>${escapeHtml(p.title.toUpperCase())}</a>`;
    })
    .join('');
}

function setupControls() {
  const motionBtn = $('#toggle-motion');
  const sync = () => {
    motionBtn.textContent = motion.enabled ? 'ANIM:ON' : 'ANIM:OFF';
    motionBtn.setAttribute('aria-pressed', String(motion.enabled));
  };
  sync();
  motionBtn.addEventListener('click', () => {
    motion.enabled = !motion.enabled;
    root.dataset.motion = motion.enabled ? 'on' : 'off';
    store.set('motion', motion.enabled ? 'on' : 'off');
    if (!motion.enabled) flushAll();
    sync();
  });

  $('#toggle-theme').addEventListener('click', () => {
    const dark = root.dataset.theme
      ? root.dataset.theme === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    store.set('theme', root.dataset.theme);
  });

  // Links scramble on hover.
  document.addEventListener('mouseover', (e) => {
    const a = e.target.closest('[data-scramble]');
    if (a && !a.contains(e.relatedTarget)) scramble(a, { duration: 380 });
  });
}

function setupProgress() {
  const el = $('#progress');
  const CELLS = 16;
  const update = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const f = max > 0 ? clamp01(scrollY / max) : 1;
    const n = Math.round(f * CELLS);
    el.textContent = `[${'█'.repeat(n)}${'░'.repeat(CELLS - n)}] ${String(Math.round(f * 100)).padStart(3, ' ')}%`;
  };
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();
}
const clamp01 = (v) => Math.max(0, Math.min(1, v));

/* --------------------------- markdown → DOM --------------------------- */

function renderHead(meta, slug) {
  const head = $('#page-head');
  const banner = meta.banner ?? meta.title ?? slug;
  const kicker = meta.kicker ?? `FILE ${slug.toUpperCase()}.MD`;
  head.innerHTML = `
    <pre class="banner" aria-hidden="true"></pre>
    <p class="kicker">${escapeHtml(kicker)}</p>
    <h1>${escapeHtml(meta.title ?? slug)}</h1>
    ${meta.subtitle ? `<p class="subtitle">${escapeHtml(meta.subtitle)}</p>` : ''}
    ${meta.date || meta.author ? `<p class="meta">${[meta.author, meta.date].filter(Boolean).map(escapeHtml).join(' &middot; ')}</p>` : ''}
  `;
  $('.banner', head).textContent = renderBannerLines(String(banner).split('|'));
}

function buildListing(code, lang) {
  const src = code.textContent.replace(/\n$/, '');
  const wrap = document.createElement('figure');
  wrap.className = 'listing';
  const label = lang ? `<figcaption><span>${escapeHtml(lang.toUpperCase())}</span><span>${src.split('\n').length} LINES</span></figcaption>` : '';
  const rows = src
    .split('\n')
    .map((l, i) => `<div class="line"><span class="ln">${pad(i + 1, 3)}</span><span class="code">${escapeHtml(l) || ' '}</span></div>`)
    .join('');
  wrap.innerHTML = `${label}<div class="paper">${rows}</div>`;
  return wrap;
}

function buildDirectory(pages) {
  const wrap = document.createElement('div');
  wrap.className = 'dir';
  const rows = pages.map((p) => {
    const name = p.slug.toUpperCase().slice(0, 8).padEnd(8, ' ');
    const title = (p.title || '').toUpperCase();
    const date = p.date || '';
    return `<a class="line" href="?p=${encodeURIComponent(p.slug)}"><span class="code">${escapeHtml(name)} MD  ${escapeHtml(date.padEnd(10, ' '))}  ${escapeHtml(title)}</span></a>`;
  });
  wrap.innerHTML =
    `<div class="line muted"><span class="code"> DIRECTORY OF /CONTENT</span></div>` +
    `<div class="line muted"><span class="code"> </span></div>` +
    rows.join('') +
    `<div class="line muted"><span class="code"> </span></div>` +
    `<div class="line muted"><span class="code"> ${pages.length} FILE(S)</span></div>`;
  return wrap;
}

function enhance(article, pages) {
  // Custom fenced blocks: ascii/art, banner, dir; everything else becomes a listing.
  for (const code of article.querySelectorAll('pre > code')) {
    const pre = code.parentElement;
    const lang = (code.className.match(/language-([\w-]+)/) || [])[1] || '';
    if (lang === 'ascii' || lang === 'art') {
      const art = document.createElement('pre');
      art.className = 'art';
      art.setAttribute('role', 'img');
      art.setAttribute('aria-label', 'ASCII illustration');
      art.textContent = code.textContent.replace(/\n$/, '');
      pre.replaceWith(art);
    } else if (lang === 'banner') {
      const b = document.createElement('pre');
      b.className = 'banner';
      b.setAttribute('aria-label', code.textContent.trim());
      b.textContent = renderBannerLines(code.textContent.split('\n'));
      pre.replaceWith(b);
    } else if (lang === 'dir') {
      pre.replaceWith(buildDirectory(pages));
    } else {
      pre.replaceWith(buildListing(code, lang));
    }
  }

  // Heading anchors.
  const used = new Set();
  for (const h of article.querySelectorAll('h1, h2, h3, h4, h5, h6')) {
    let id = slugify(h.textContent);
    while (used.has(id)) id += '-';
    used.add(id);
    h.id = id;
  }

  // Relative `something.md` links become router links.
  for (const a of article.querySelectorAll('a[href]')) {
    const href = a.getAttribute('href');
    const m = href.match(/^(?:\.\/)?([a-z0-9-]+)\.md(#.*)?$/i);
    if (m) a.setAttribute('href', `?p=${m[1].toLowerCase()}${m[2] || ''}`);
    else if (/^https?:/.test(href)) a.setAttribute('rel', 'noopener');
    a.setAttribute('data-scramble', '');
  }

  // Images get a numbered caption.
  let fig = 0;
  for (const img of article.querySelectorAll('img')) {
    const f = document.createElement('figure');
    f.className = 'figure';
    img.replaceWith(f);
    f.append(img);
    const cap = document.createElement('figcaption');
    cap.textContent = `FIG. ${pad(++fig)} — ${img.alt || 'Untitled'}`;
    f.append(cap);
    const p = f.parentElement;
    if (p.tagName === 'P' && p.childNodes.length === 1) p.replaceWith(f);
  }

  // Tables scroll sideways on small screens.
  for (const t of article.querySelectorAll('table')) {
    const w = document.createElement('div');
    w.className = 'table-wrap';
    t.replaceWith(w);
    w.append(t);
  }
}

function renderToc(article) {
  const toc = $('#toc');
  const hs = Array.from(article.querySelectorAll('h2'));
  if (!hs.length) return;
  toc.hidden = false;
  toc.innerHTML =
    `<p class="toc-title">CONTENTS</p>` +
    hs
      .map((h, i) => `<a class="line" href="#${h.id}"><span class="code"><span class="n">${pad(i + 1)}</span><span class="t">${escapeHtml(h.textContent)}</span></span></a>`)
      .join('');
}

/* --------------------------- reveal choreography --------------------------- */

const FX = {
  scramble: (el, o) => scramble(el, o),
  type: (el, o) => typewriter(el, { ...o, exclude: 'ul, ol, p, pre, table' }),
  art: (el, o) => printArt(el, o),
  shade: (el, o) => printArt(el, { ...o, shades: true }),
  lines: (el, o) => lines(el, o),
  fade: (el, o) => fade(el, o),
};

const queue = [];
let running = false;
let observer;

function tag(el, fx) {
  el.dataset.fx = fx;
  el.classList.add('pending');
}

function prepare(scope) {
  const targets = [];
  const add = (sel, fx) => scope.querySelectorAll(sel).forEach((el) => { tag(el, fx); targets.push(el); });

  add('.page-head .banner, .prose .banner', 'shade');
  add('.page-head .kicker, .page-head .subtitle, .page-head .meta', 'type');
  add('h1, h2, h3, h4, h5, h6', 'scramble');
  add('.prose p, .prose blockquote > p', 'type');
  add('.prose pre.art', 'art');
  add('.prose .listing, .prose .dir, .toc:not([hidden])', 'lines');
  add('.prose hr, .prose .figure, .prose .table-wrap', 'fade');

  // List items: type the item's own text; nested lists and paragraphs get their own turn.
  scope.querySelectorAll('.prose li').forEach((li) => {
    if (li.querySelector(':scope > p')) return;
    tag(li, 'type');
    targets.push(li);
  });
  return targets;
}

const docOrder = (a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);

function enqueue(el) {
  if (el.dataset.queued) return;
  el.dataset.queued = '1';
  queue.push(el);
  queue.sort(docOrder);
  if (!running) run();
}

async function run() {
  running = true;
  while (queue.length) {
    const el = queue.shift();
    // Things scrolled well past are finished instantly; a long backlog speeds everything up.
    const instant = !motion.enabled || el.getBoundingClientRect().bottom < -200;
    const speed = 1 + queue.length * 0.6;
    await FX[el.dataset.fx](el, { speed, instant });
  }
  running = false;
}

function flushAll() {
  observer?.disconnect();
  queue.length = 0;
  document.querySelectorAll('.pending').forEach((el) => FX[el.dataset.fx]?.(el, { instant: true }));
}

function observe(targets) {
  if (!motion.enabled) {
    targets.forEach((el) => FX[el.dataset.fx](el, { instant: true }));
    return;
  }
  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        observer.unobserve(e.target);
        enqueue(e.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0 }
  );
  targets.forEach((el) => observer.observe(el));
}

/** Shrink banners so their widest line fits the column. */
function fitBanners() {
  for (const el of document.querySelectorAll('.banner')) {
    el.style.fontSize = '';
    const base = parseFloat(getComputedStyle(el).fontSize);
    if (el.scrollWidth > el.clientWidth) {
      el.style.fontSize = `${Math.max(3, (base * el.clientWidth) / el.scrollWidth - 0.1)}px`;
    }
  }
}

/* ------------------------------ boot line ------------------------------ */

async function boot(slug, bytes) {
  const el = $('#boot');
  const lines = [
    `> LOAD "${slug.toUpperCase()}.MD"`,
    `  READING ........ ${bytes.toLocaleString('en-US')} BYTES`,
    `  PARSING ........ OK`,
    `> RUN`,
  ];
  if (!motion.enabled) {
    el.textContent = lines.join('\n');
    return;
  }
  for (const line of lines) {
    for (let i = 0; i <= line.length; i += 2) {
      if (!motion.enabled) break;
      el.textContent = lines.slice(0, lines.indexOf(line)).concat(line.slice(0, i) + '█').join('\n');
      await new Promise((r) => requestAnimationFrame(r));
    }
    el.textContent = lines.slice(0, lines.indexOf(line) + 1).join('\n');
    await new Promise((r) => setTimeout(r, 70));
  }
}

/* ------------------------------ main ------------------------------ */

async function main() {
  const params = new URLSearchParams(location.search);
  const raw = (params.get('p') || 'home').toLowerCase();
  const slug = /^[a-z0-9-]+$/.test(raw) ? raw : 'home';

  setupControls();
  setupProgress();

  const [pages, page] = await Promise.all([loadPages(), loadMarkdown(slug)]);
  renderNav(pages, slug);

  const { meta, body } = parseFrontMatter(page.src);
  const info = pages.find((p) => p.slug === slug);
  document.title = `${meta.title ?? info?.title ?? slug} — Lorem Terminal`;

  renderHead(meta, slug);
  const article = $('#article');
  article.innerHTML = window.marked ? window.marked.parse(body) : `<pre>${escapeHtml(body)}</pre>`;
  enhance(article, pages);
  if (meta.toc) renderToc(article);

  const bytes = new TextEncoder().encode(page.src).length;
  $('#eof').innerHTML = `<span>END OF FILE</span><span>${bytes.toLocaleString('en-US')} BYTES</span><span><a href="#main" data-scramble>TOP ↑</a></span>`;

  fitBanners();
  addEventListener('resize', fitBanners);
  document.fonts?.ready.then(fitBanners);

  const targets = prepare(document.querySelector('#main'));
  await boot(slug, bytes);
  observe(targets);

  if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
}

main();
