---
title: "Why agent memory is not just a vector database"
description: "Task state, provenance, authority and time all matter. Similarity search alone captures none of them."
pubDate: 2026-09-23
tags: [agents, research]
draft: true
---

> DRAFT: outline and working notes. Not for publication yet.

"Memory" in agent systems often means embeddings plus similarity search. That finds text that
looks relevant. It doesn't know where the text came from, whether it is still true, or whether
it should be trusted.

## What memory needs to carry

- **Task state**: where the work is up to.
- **Provenance**: where each fact came from.
- **Authority**: who is allowed to have written it.
- **Time**: when it was true.
- [TODO: examples of each failing]

## Memory as an attack surface

- Poisoned memories persist across tasks.
- [TODO: how provenance limits the damage]

## Healing

- Detecting and repairing wrong or stale context.
- [TODO: approach]

## A sketch of a better design

[TODO]
