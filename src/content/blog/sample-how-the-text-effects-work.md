---
title: "Sample post: how the text effects work"
description: "A sample article, written to exercise headings, lists, code and images. It describes how this site animates its ASCII text."
pubDate: 2026-09-23
tags: [sample, site]
---

> This is sample writing, included to show the article layout. Replace or delete it.

Every animated block on this site is plain text in the HTML. A small script rewrites that text
about twenty-four times a second while it settles, then leaves the final text in place.

## Reserve the space first

The finished text is rendered immediately, with every character that has not been "typed" yet
swapped for a space. Line breaks stay where they are, so the block is already its final size and
nothing below it moves.

## Let a few characters linger

Chosen characters flicker between their real glyph and random ones for a short, random time.
Durations are sampled with a bias:

```ts
function sample({ from, to, bias }: Range, rng = Math.random): number {
	let unit = rng();
	if (bias) unit = Math.pow(unit, bias);
	return from + unit * (to - from);
}
```

With a bias of 6, most characters settle almost instantly and a handful keep boiling, which
reads as an uneven print head rather than a uniform fade.

## What it respects

- `prefers-reduced-motion`: nothing animates, the final text is shown as-is.
- The `[ motion ]` switch in the footer, remembered per browser.
- Screen readers get the real text; the animated copy is `aria-hidden`.

![A 5 by 5 pixel letter A drawn as a grid](./images/glyph-a.svg)

1. Render the final text.
2. Blank what is not revealed yet.
3. Rewrite, frame by frame, until it settles.
