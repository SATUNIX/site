---
title: "The approval came after the action"
description: "An agent changed a file before the approval prompt said it was allowed to. Why UI-level approvals are not enforcement."
pubDate: 2026-09-23
tags: [ai-security, agents]
draft: false
wip: true
---

While testing an approval gate for a tool-using agent, the order of events came out wrong: the
file had already changed by the time the approval prompt appeared. The user was being asked
to authorise something that had already happened.

## What happened

- [TODO: sequence of events, generic and reproducible. Agent, tool, file, prompt.]
- [TODO: how it was noticed]

## Why it happens

- The approval lived in the interface, not in the execution path.
- A prompt that *describes* a decision is not the same as a gate that *enforces* one.
- [TODO: the specific class of design mistake, without naming a product]

## Approval as enforcement

- The tool call must block until a decision exists.
- The decision must be bound to the exact call that was approved (arguments and all).
- Log the decision and the execution as one record.
- [TODO: minimal pattern / pseudocode]

## How to test for it

- Race the UI: does anything change before the user answers?
- Deny, then check nothing happened.
- [TODO: short test checklist]

## Takeaway

[TODO: one paragraph. If approval can arrive after the action, it isn't approval.]
