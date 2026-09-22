---
title: "Designing cyber agents that know their rules of engagement"
description: "Scope should be enforceable machine state, not prose buried in a prompt."
pubDate: 2026-09-23
tags: [ai-security, pentesting, agents]
draft: false
wip: true
---

Human testers work inside a signed scope and rules of engagement. An agent doing security work
needs the same, and "please only test these hosts" in a prompt is not it.

## Scope as data

- Targets, time windows, allowed techniques, as structured state.
- Signed, versioned, checked on every action.
- [TODO: schema sketch]

## Enforcement points

- Before every tool call, outside the model.
- [TODO: what happens on a violation]

## Human approval for real-world actions

- Which actions always need a person.
- [TODO: approval flow]

## Testing the guardrails

[TODO: how to prove the agent can't leave scope]
