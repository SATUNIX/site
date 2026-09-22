# Lorem Terminal

A small static site that turns markdown files into pages in a retro monospace style, with animated text: headings decode out of random glyphs, paragraphs are typed in with a block cursor, ASCII art sweeps in like a print head, and code blocks print line by line on green-bar fanfold paper.

There is no build step. Drop a `.md` file into `content/`, list it in `content/pages.json`, and it becomes a page.

```
index.html               single page shell (router: ?p=<slug>)
assets/css/style.css     all styling: tokens, light/dark, layout, effect states
assets/js/app.js         loads markdown, renders it, decides what animates and when
assets/js/effects.js     the text effects (scramble, typewriter, print, lines, fade)
assets/js/ascii-font.js  5-row block font used for banners
assets/vendor/marked.min.js   markdown parser (marked v12, MIT)
content/pages.json       page list, used for the nav and ```dir blocks
content/*.md             the pages
```

## Running locally

Pages are loaded with `fetch`, so you need a web server. Opening `index.html` straight from disk won't work.

```sh
python3 -m http.server 8000
# then open http://localhost:8000/?p=home
```

Any static host works: GitHub Pages (a `.nojekyll` file is included), Netlify, Cloudflare Pages, S3 and so on.

## Adding a page

1. Create `content/my-page.md`. Slugs may contain only `a-z`, `0-9` and `-`.
2. Add it to `content/pages.json`:

   ```json
   { "slug": "my-page", "title": "My Page", "date": "2026-09-22", "nav": true }
   ```

   `nav: false` keeps a page out of the top bar. It still appears in `dir` listings.
3. Visit `?p=my-page`. In markdown, link to other pages as `[text](my-page.md)`. These links are rewritten to `?p=my-page` automatically.

A slug with no matching file gets a built-in 404 page.

### Front matter

All fields are optional.

```yaml
---
title: The original listing          # page <h1> and browser tab title
banner: SOURCE                       # ASCII block banner; use | for multiple lines, e.g. LOREM|IPSUM
kicker: CHAPTER 02 / LISTINGS        # small accent line above the title (default: FILE <SLUG>.MD)
subtitle: One or two sentences.      # dek under the title
author: Lorem Ipsum
date: 2026-09-18
toc: true                            # auto "CONTENTS" block built from the page's ## headings
---
```

## Markdown features

Standard markdown (GitHub-flavoured, via marked) all works: headings, emphasis, links, lists, blockquotes, tables, images and rules. Each gets a style and an entrance effect:

| Element | Style | Effect |
| --- | --- | --- |
| `#`–`######` | uppercase; `##` gets a `[01]` counter, `###` a `▸` | **scramble**: glyphs lock in left to right |
| paragraphs, list items | 72-character measure, `*` bullets | **typewriter**: block cursor plus a noise band ahead of it |
| `> quote` | larger text behind a `>` gutter | typewriter |
| fenced code | numbered listing on green-bar paper with tractor holes | **lines**: one line at a time, each flashing and resolving |
| `---` | row of `* * *` | wipes in left to right |
| images | greyscale, captioned `FIG. 01 — alt text` | fade |
| tables | dashed rules, scroll sideways on mobile | fade |

### Special fenced blocks

The language tag after the opening fence (```` ``` ````) switches the renderer:

````md
```ascii
+--------+     +--------+
| LOREM  | --> | IPSUM  |
+--------+     +--------+
```
````
Prints hand-drawn ASCII art verbatim, with a diagonal sweep. `art` works too.

````md
```banner
LOREM
2026
```
````
Renders each line in the built-in block font with a drop shadow, swept in with `░▒▓` shading. The banner shrinks automatically to fit narrow screens. Supported characters: `A–Z 0–9` and `- _ . , : ! ? / ' ( ) + = < > * # $ % & @`.

````md
```dir
```
````
Prints a DOS-style directory listing of every page in `pages.json`. Each row links to its page.

Any other language, such as `basic`, `asm`, `js` or none, becomes a numbered listing labelled with the language and its line count.

## How the animation works

The ideas behind the "live monospace" feel:

1. **Monospace makes it stable.** Every character is the same width, so swapping a letter for a random glyph never moves the text around it. All the effects rely on this.
2. **Typing without layout shift.** Before a paragraph animates, each text node is split into three parts: `typed text`, a `noise` span (the next 3 characters as random accent-coloured glyphs) and a `ghost` span (the rest of the text, in `color: transparent`). The paragraph therefore always takes its final size. Inline links, `code` and **bold** keep their markup because only text nodes change.
3. **Scramble.** Each character gets its own lock-in time: mostly left to right, plus some random jitter. Until that time, every animation frame shows a random glyph from `!<>-_\/[]{}=+*^?#%&@$01`.
4. **Print sweep.** ASCII art and banners are treated as a grid. Each cell's reveal time depends on `column + 2 × row`, which gives a diagonal wipe. Cells just ahead of the edge show noise (or `░▒▓` shades for banners).
5. **Choreography.** An `IntersectionObserver` queues elements as they scroll into view and plays them one at a time, in document order. When several are waiting, each plays faster (`speed = 1 + 0.6 × queued`), so fast scrolling never leaves you waiting. Elements already scrolled far past are shown instantly.
6. **Hover.** Any link with `data-scramble` (nav, footer and all links in the content) re-scrambles on hover.

Every effect lives in `assets/js/effects.js`. Each takes `(element, { speed, instant })` and returns a Promise, so a new effect is a single function added to the `FX` map in `app.js`.

### Tuning

| What | Where |
| --- | --- |
| Typing speed | `typewriter()` in `effects.js`: `clamp(N * 9, 280, 1800)` ms per paragraph |
| Scramble duration | `scramble()`: `clamp(total * 28, 450, 1100)` ms |
| Noise glyph set | `NOISE` constant in `effects.js` |
| Which elements get which effect | `prepare()` in `app.js` |
| Backlog speed-up | `run()` in `app.js` |
| Colours, fonts, measure | CSS custom properties at the top of `style.css` |

## Accessibility and preferences

- **Reduced motion:** if the OS setting `prefers-reduced-motion` is on, everything renders instantly.
- **ANIM:ON/OFF** in the top bar turns animation off and finishes any running effect at once. The choice is remembered.
- **THEME** switches between "paper" (light) and "phosphor" (dark). The default follows the system setting and the choice is remembered.
- Decorative ASCII (banners, the boot lines) is `aria-hidden`. `ascii` art is exposed as `role="img"`.
- There's a skip link, focus rings are visible, and the layout has no horizontal scroll at phone width.

## Notes

- Markdown is rendered as HTML without sanitising, which is fine for content you write yourself. If pages ever come from untrusted sources, add a sanitiser such as DOMPurify before the `innerHTML` in `app.js`.
- Font: [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono) via Google Fonts. It falls back to the system monospace font.
- All content is lorem ipsum placeholder text.
