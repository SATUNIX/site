---
title: "TTFT is often more important than tokens per second"
description: "For interactive and agent workloads, waiting for the first token shapes the experience more than raw generation speed."
pubDate: 2026-09-23
tags: [local-ai, infrastructure, agents]
draft: true
---

> DRAFT: scaffold only. Measurements to come from real benchmarks.

Inference benchmarks love tokens per second. For interactive use, and especially for agents
that make many short calls, the number that dominates is how long you wait before anything
comes back at all.

## Why TTFT dominates agent loops

- Agents make many small calls; each pays the time-to-first-token cost.
- Prompt processing grows with context; generation often doesn't need to be long.
- [TODO: sketch of where time goes in one agent step]

## What moves TTFT

- Prompt length and prefix caching.
- Batch and concurrency settings.
- Hardware and offload.
- [TODO: which of these mattered most in practice]

## Measuring it properly

- [TODO: method - warm vs cold, cached vs uncached prefixes]

## Results

[TODO: table from real runs. No placeholder figures in the published version.]

## Takeaways

[TODO]
