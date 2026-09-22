---
title: "What adversary emulation is actually for"
description: "Not a trophy hunt. Attack-path discovery, telemetry, visibility gaps and proving that detections and playbooks work."
pubDate: 2026-09-23
tags: [offensive-security, adversary-simulation]
draft: true
---

> DRAFT: outline and working notes. Not for publication yet.

Adversary emulation is easy to misread as "red team gets domain admin, writes report". The
access is the least interesting output. The value is in what the exercise reveals about how an
environment behaves under a realistic attacker.

## What it produces

- **Attack paths**: how compromise actually chains together, not a list of isolated issues.
- **Telemetry**: real attacker activity for defenders to look at.
- **Visibility gaps**: what happened that nobody could see.
- **Detection and playbook validation**: do the alerts fire, and does the response work?
- **Architectural weakness**: problems no single finding captures.

## Designing an emulation that answers questions

- [TODO: start from the question, not the technique list]
- [TODO: how scope and safety constraints shape the plan]

## Working with the blue team

[TODO: before, during, after - generic, not tied to any engagement]

## Reporting what matters

[TODO: paths and gaps over trophies]
