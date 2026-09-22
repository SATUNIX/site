---
title: "Recursive agents and the context problem"
description: "How does a subagent know what it needs without inheriting the entire parent context?"
pubDate: 2026-09-23
tags: [agents, research, soar]
draft: true
---

> DRAFT: outline and working notes. Not for publication yet.

When an agent delegates, the easy option is to pass everything down. It doesn't scale: each
level inherits more noise, costs more, and gets easier to steer with irrelevant content.

## Too little vs too much

- Too little: the worker guesses.
- Too much: the worker drowns, and untrusted content spreads.
- [TODO: example]

## Context routing

- Decide what each subtask needs at delegation time.
- Let workers ask for more, explicitly.
- [TODO: the mechanism used in SOAR]

## Returning results

- Summaries up, evidence stored alongside.
- [TODO: how parents verify child results]

## Open questions

[TODO]
