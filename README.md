# site

A personal site: dark, minimal and editorial, with animated ASCII type. It's built with
[Astro](https://astro.build) as a fully static site and deployed to GitHub Pages.

- **Home**: an ASCII wordmark, intro, key-info readout, scope, recent writing
- **Work**: representative engagement types (types of work, never specific clients)
- **Projects**: personal research and experiments from the private lab
- **Writing**: Markdown posts with RSS, sitemap and code highlighting
- **CV**: roles, capabilities, credentials and skills, with a clean print stylesheet
- **Links**: GitHub, Gravatar, feed, and an OpenPGP key (fingerprint derived at build time)

No framework runtime, no CSS framework, no backend. The animation engine is about 3.4 KB of
gzipped JS and loads only on pages that use it. Articles and the CV ship no JavaScript.

## Commands

Requires Node 22.11+ (`.nvmrc` pins 26).

| Command | What it does |
| --- | --- |
| `npm install` | install dependencies |
| `npm run dev` | dev server with live reload (drafts visible) |
| `npm run build` | derive the PGP fingerprint, then build to `dist/` |
| `npm run preview` | serve the production build locally |
| `npm run check` | Astro and TypeScript diagnostics |
| `npm test` | unit tests (URL helpers, PGP, animation engine, banner font) |
| `npm run verify` | all of the above plus `check:site` (the CI gate) |

`check:site` enforces printable-ASCII-only source, base-path-safe URLs, and the expected
build output.

## Where the content lives

Content is kept apart from presentation. Edit these, not the pages:

| File | Content |
| --- | --- |
| `src/config/site.ts` | name, tagline, description, links (`null` leaves a link off the site) |
| `src/data/profile.ts` | homepage intro and key-info readout |
| `src/data/work.ts` | representative engagement types for /work/ |
| `src/data/projects.ts` | research and experiments for /projects/ |
| `src/data/cv.ts` | summary, roles, capabilities, credentials, skills |
| `src/content/blog/*.md` | posts (all current posts are drafts: `draft: true`) |
| `public/keys/public.asc` | optional OpenPGP public key, then set `pgpKeyPath: "keys/public.asc"` |

Work entries describe types of work repeated across many engagements. Keep them that way:
no client names, sectors, architectures or findings.

### Drafts

The posts in `src/content/blog/` are scaffolds with `[TODO]` markers. They show in
`npm run dev` (marked `[ draft ]`) and are excluded from production builds, RSS and the
sitemap. To publish one, fill in the TODOs, set a real `pubDate`, and set `draft: false`.
Find what's left with `grep -rn TODO src/content/blog`.

The wordmark is generated from `site.name` at build time (`src/scripts/ascii/font.ts`,
letters A-Z, digits, `-`, `.` and `'`). Each word goes on its own line.

### Writing a new post

Add `src/content/blog/my-post.md`:

```md
---
title: My post
description: One sentence for the list, RSS and meta description.
pubDate: 2026-09-23
tags: [notes]
draft: false # true = visible in `npm run dev` only
---

Markdown here. Put images next to the post and link them relatively: ![alt](./images/x.png)
```

The file name becomes the URL: `/blog/my-post/`.

## Deploying to GitHub Pages

`.github/workflows/deploy.yml` runs `npm run verify` and publishes `dist/` on every push to
`main` (or on a manual run).

1. On GitHub: **Settings > Pages > Build and deployment > Source: GitHub Actions**.
2. Push to `main`.

The site is configured for the project URL `https://satunix.github.io/site/`
(`url` + `base` in `src/config/site.ts`). For a custom domain, or a `<user>.github.io`
repository, set `url` to that origin and `base` to `""`. All internal links go through
`src/lib/url.ts`, so nothing else needs to change.

## How the text effects work

The approach follows how gatesnotes.com animates its monospace text, reimplemented from
scratch in `src/scripts/ascii/`:

- **The final text is the HTML.** No-JS and reduced-motion visitors simply see it.
- **Space is reserved.** Characters not yet revealed render as spaces (line breaks kept), so
  the block is at full size from the first frame and nothing below it moves.
- **Biased randomness.** Chosen characters flicker between their real glyph and random ones.
  Durations are sampled as `from + rand^bias * (to - from)`, so most settle almost instantly
  and a few linger, which reads like an uneven print head.
- **One loop, capped.** A single `requestAnimationFrame` loop redraws at most 24 times a
  second, only while something is animating, and starts each block's clock on its first
  visible frame.
- **Triggered by scroll.** An IntersectionObserver starts each block as it enters the viewport.
- **Accessible.** Animated copies are `aria-hidden`; the real text sits underneath (headings)
  or in a visually-hidden element (the wordmark). The `[ motion ]` footer switch pauses
  everything and is remembered, and `prefers-reduced-motion` turns animation off entirely.

| File | Role |
| --- | --- |
| `animator.ts` | pure frame engine: reveal schedules (type, lines, scatter, etch) + cycle layers |
| `presets.ts` | named timings: `hero-etch`, `hero-decrypt`, `hero-scatter`, `label`, `meta`, `title`, `copy`, `art` |
| `index.ts` | DOM runtime: observer, render loop, pointer ripple, motion toggle |
| `font.ts` | 5-row bitmap font for the banner (wide and compact variants) |

Opt any element in with `data-ascii="<preset>"`, or use `<RevealText text="..." preset="title" />`.

The hero has three entrance modes, switchable with the buttons under the wordmark. Once you've
picked one, set it with `<HeroArtwork mode="decrypt" showModeSwitch={false} />` in
`src/pages/index.astro`.

## Layout

```
src/
  config/site.ts        identity, links, deploy URL + base path
  data/                 profile, CV, derived PGP fingerprint
  content/blog/         Markdown posts
  pages/                routes: /, /blog/, /blog/<id>/, /cv/, /links/, 404, rss.xml
  layouts/ components/  page shell, header/footer, hero, post list, reveal text
  scripts/ascii/        animation engine (framework-free, unit tested)
  styles/               tokens, base, layout, prose, ascii, print
scripts/                build-time fingerprint derivation, offline site checks
legacy/lorem-terminal/  the earlier no-build prototype, kept for reference (not deployed)
```
