---
title: Colophon
banner: ABOUT
kicker: APPENDIX / HOW THIS WORKS
subtitle: At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium.
date: 2026-09-01
---

This page doubles as a reference for every markdown feature the renderer styles. Lorem ipsum dolor sit amet, consectetur adipiscing elit.

## Headings

Headings decode out of random glyphs. `h2` gets a section counter, `h3` a triangle marker.

### A third-level heading

#### A fourth-level heading

## Paragraphs and inline text

Paragraphs are typed in with a block cursor and a short band of noise ahead of it. Inline **bold**, *italic*, `inline code` and [links](home.md) survive the effect intact. Hover any link to scramble it.

## Lists

- Lorem ipsum dolor sit amet
- Consectetur adipiscing elit
  - Nested item, sed do eiusmod
- Tempor incididunt ut labore

1. Ordered lists
2. Use accent-coloured markers
3. Et dolore magna aliqua

## Quotes

> Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

## Banners

A fenced block with the `banner` language renders text in the built-in block font, one banner per line:

```banner
LOREM
2026
```

## ASCII art

A fenced block with the `ascii` (or `art`) language is swept in diagonally:

```ascii
   +--------+       +--------+       +--------+
   | LOREM  | ----> | IPSUM  | ----> | DOLOR  |
   +--------+       +--------+       +--------+
        ^                                 |
        |_________________________________|
```

## Code

Any other fenced block becomes a green-bar listing:

```js
const lorem = 'ipsum';
console.log(`${lorem} dolor sit amet`);
```

## Rules

A horizontal rule wipes in:

---

Fin. Ut enim ad minima veniam.
