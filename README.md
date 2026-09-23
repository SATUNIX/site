# site

[![CI](https://github.com/SATUNIX/site/actions/workflows/ci.yml/badge.svg)](https://github.com/SATUNIX/site/actions/workflows/ci.yml)
[![CodeQL](https://github.com/SATUNIX/site/actions/workflows/codeql.yml/badge.svg)](https://github.com/SATUNIX/site/actions/workflows/codeql.yml)
[![License: MIT (code)](https://img.shields.io/badge/license-MIT%20(code)-informational)](LICENSE)

Personal site and CV of Tony: offensive security and security engineering.

**Live:** <https://satunix.github.io/site/>

A dark, minimal, editorial site with animated ASCII type. It is a fully static
[Astro](https://astro.build) build with no framework runtime, no CSS framework and no backend.
The animation engine is written from scratch, framework-free and unit tested, ships about
3 KB of gzipped JavaScript, and loads only on pages that use it.

| Page | Content |
| --- | --- |
| [Home](https://satunix.github.io/site/) | ASCII wordmark, intro, key-info readout, scope, recent writing |
| [Work](https://satunix.github.io/site/work/) | Representative engagement types (never specific clients) |
| [Projects](https://satunix.github.io/site/projects/) | Personal research and experiments |
| [Writing](https://satunix.github.io/site/blog/) | Markdown posts with RSS and a sitemap |
| [CV](https://satunix.github.io/site/cv/) | Roles, capabilities, credentials and skills; prints to a clean PDF |
| [Links](https://satunix.github.io/site/links/) | Profiles, feed and an OpenPGP key (fingerprint derived at build time) |

## Highlights

- **Security by default.** A strict Content Security Policy on every page, with every inline
  script and style allowed only by its build-time hash. A CI gate fails the build if anything
  would be blocked. Details in [Security](#security).
- **Accessible motion.** The final text is always the real HTML. Animated copies are
  `aria-hidden`, a footer switch pauses motion (and is remembered), and
  `prefers-reduced-motion` turns it off entirely.
- **No layout shift.** Unrevealed characters render as spaces, so each block is full size from
  the first frame.
- **Agent-readable.** Every page has a Markdown twin, indexed by
  [`/llms.txt`](https://satunix.github.io/site/llms.txt).
- **Base-path safe.** The same build works at a domain root or under `/<repository>/`; every
  internal URL goes through one module, and a check enforces it.

## Quick start

Requires Node 22.11 or newer (`.nvmrc` pins 26).

```sh
npm ci
npm run dev       # http://localhost:4321/site/ with live reload; drafts visible
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with live reload |
| `npm run build` | Derive the PGP fingerprint, then build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run check` | Astro and TypeScript diagnostics |
| `npm test` | Unit tests: URL, CSP and PGP helpers, animation engine, banner font |
| `npm run check:site` | Offline checks against `src/` and `dist/` (below) |
| `npm run verify` | All of the above in order: the CI gate |

`check:site` enforces:

1. **ASCII purity:** every source file under `src/` is printable US-ASCII.
2. **Base-path safety:** no raw root-absolute `href`/`src` outside `src/lib/url.ts`.
3. **Routes:** every expected page, feed and Markdown twin was emitted.
4. **CSP coverage:** every built page has a policy, every inline block is hashed in it,
   and there are no inline `style=""` attributes or `on*` handlers.

## Project layout

```
src/
  config/site.ts        identity, links, deploy URL and base path
  data/                 profile, work, projects, CV, derived PGP fingerprint
  content/blog/         Markdown posts
  pages/                routes, plus rss.xml, robots.txt, llms.txt, llms-full.txt, *.md twins
  layouts/              page shell (meta, CSP-hashed inline CSS) and article layout
  components/           header, footer, hero, post and entry lists, reveal text
  lib/                  base-path URLs, CSP hashing, Markdown twins, posts, PGP, hero geometry
  scripts/ascii/        animation engine (framework-free, unit tested)
  styles/               tokens, base, layout, prose, ascii, print
  assets/fonts/         JetBrains Mono (OFL-1.1), fingerprinted by the bundler
scripts/                build-time fingerprint derivation, offline site checks
.github/                CI and deploy, CodeQL, Dependabot
```

## Editing content

Content is kept apart from presentation. Edit these, not the pages:

| File | Content |
| --- | --- |
| `src/config/site.ts` | Name, tagline, description, links (`null` leaves a link off) |
| `src/data/profile.ts` | Homepage intro and key-info readout |
| `src/data/work.ts` | Engagement types for `/work/` |
| `src/data/projects.ts` | Research and experiments for `/projects/` |
| `src/data/cv.ts` | Summary, roles, capabilities, credentials, skills |
| `src/content/blog/*.md` | Posts |
| `public/keys/public.asc` | Optional OpenPGP public key; then set `pgpKeyPath: "keys/public.asc"` |

Work entries describe types of work repeated across many engagements. Keep them that way:
no client names, sectors, architectures or findings.

### Posts

Add `src/content/blog/my-post.md`; the file name becomes the URL (`/blog/my-post/`):

```md
---
title: My post
description: One sentence for the list, RSS and meta description.
pubDate: 2026-09-23
tags: [notes]
---

Markdown here. Put images next to the post and link them relatively: ![alt](./images/x.png)
```

Two front-matter flags control publishing:

- `draft: true`: visible in `npm run dev` only; never built for production.
- `wip: true`: published but labelled `[ draft ]`, `noindex`ed and kept out of RSS.

The current posts are `wip` outlines. To finish one, fill in its `[TODO]` markers, set a real
`pubDate` and remove `wip: true` (`grep -rn TODO src/content/blog` lists what is left).

## How the text effects work

The approach follows how gatesnotes.com animates its monospace text, reimplemented from
scratch in `src/scripts/ascii/`:

- **Scramble typing.** Text types in left to right with a band of noise ahead of the cursor.
  Noise keeps each character's class (lowercase, uppercase, digit), so word shapes hold while
  they resolve.
- **Biased randomness.** Settle times are sampled as `from + rand^bias * (to - from)`: most
  characters land almost at once and a few linger, like an uneven print head.
- **Etched wordmark.** The name banner is generated from `site.name` at build time from a
  5-row bitmap font, then drawn in by a slanted wavefront that trails noise.
- **Replays on scroll.** An `IntersectionObserver` types each block in as it enters the
  viewport and resets it when it leaves.
- **One capped loop.** A single `requestAnimationFrame` loop redraws at 24 to 30 fps, and only
  while something is animating. All DOM writes use `textContent`.

| File | Role |
| --- | --- |
| `animator.ts` | Pure frame engine: reveal schedules (type, scramble, etch) and cycle layers |
| `presets.ts` | Named timings: `hero-etch`, `label`, `meta`, `title`, `copy` |
| `index.ts` | DOM runtime: observer, render loop, pointer ripple, motion toggle |
| `font.ts` | 5-row bitmap font for the banner (wide and compact variants) |

Opt an element in with `<RevealText text="..." preset="copy" as="p" />`, or `data-ascii` on a
`pre`. Article bodies stay static so long reads never wait on an animation, and print output
always shows the real text.

## Security

GitHub Pages cannot set response headers, so the policy is delivered as a
`<meta http-equiv="Content-Security-Policy">` generated by Astro:

```
default-src 'self'; script-src 'self' 'sha256-...'; style-src 'self' 'sha256-...';
img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none';
base-uri 'self'; form-action 'none'; upgrade-insecure-requests
```

- Astro hashes the scripts and styles it bundles. The few `is:inline` blocks (the pre-paint
  motion script and per-page banner sizing) are rendered from strings and registered through
  `src/lib/csp.ts`, so there is no `'unsafe-inline'`.
- Code highlighting uses Prism (class-based) rather than Shiki, whose inline styles the
  policy would block.
- `check:site` recomputes every inline block's hash from the built HTML and fails if one is
  missing from the policy.
- A `strict-origin-when-cross-origin` referrer policy is set on every page.

The CI workflow runs with a read-only token (only the deploy job can write to Pages), pins
every action to a commit SHA, installs from the lockfile, verifies npm registry signatures and
fails on high-severity advisories. CodeQL scans the source and workflows, and Dependabot keeps
npm packages and actions current.

To report a vulnerability, see [SECURITY.md](SECURITY.md).

## For agents

- [`/llms.txt`](https://satunix.github.io/site/llms.txt): an [llms.txt](https://llmstxt.org)
  index of the site
- [`/llms-full.txt`](https://satunix.github.io/site/llms-full.txt): every page and post as one
  Markdown document
- `/<page>.md`: a Markdown twin of every page (`/cv.md`, `/work.md`, `/blog/<post>.md`, ...),
  advertised from each HTML page with `<link rel="alternate" type="text/markdown">`

These are generated at build time from the same data as the HTML (`src/lib/markdown.ts`), so
the two cannot drift.

## Deployment

`.github/workflows/ci.yml` verifies every pull request and push. Pushes to `main` then deploy
`dist/` to GitHub Pages (Settings > Pages > Source: **GitHub Actions**).

The site is configured for `https://satunix.github.io/site/` (`url` and `base` in
`src/config/site.ts`). For a custom domain or a `<user>.github.io` repository, set `url` to
that origin and `base` to `""`; nothing else needs to change.

## License

The source code is [MIT](LICENSE). The written and personal content (`src/content/`,
`src/data/`, `public/keys/`) is all rights reserved. JetBrains Mono is under the SIL Open Font
License 1.1.
