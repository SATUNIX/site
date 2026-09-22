---
title: "Running 27B models on constrained hardware"
description: "Quantisation, the VRAM/RAM split, context size and throughput: lessons from running mid-size models on hardware that is not built for it."
pubDate: 2026-09-23
tags: [local-ai, infrastructure]
draft: false
wip: true
---

A 27B-parameter model is big enough to be genuinely useful for agent work and small enough to
tempt you into running it on hardware that was never meant for it. This is what that looks
like in practice.

## Test setup

- Hardware: [TODO: CPU, GPU, VRAM, system RAM]
- Runtime: [TODO: llama.cpp / llama-server version, flags]
- Model and quantisations tested: [TODO]

## Quantisation

- [TODO: quality vs size across the quantisations tried]
- [TODO: where quality visibly dropped for agent tasks]

## Splitting across VRAM and RAM

- [TODO: layers offloaded vs speed]
- [TODO: the point where CPU offload stops being worth it]

## Context size

- [TODO: memory cost of longer contexts; KV cache settings]

## Throughput and time to first token

| Config | TTFT | Tokens/s | Notes |
| --- | --- | --- | --- |
| [TODO] | [TODO] | [TODO] | [TODO] |

## What I'd do again

[TODO]
