---
title: "Agents need a control plane, not just a system prompt"
description: "A system prompt is a request, not a boundary. Tool-using agents need enforcement that sits outside the model."
pubDate: 2026-09-23
tags: [ai-security, agents]
draft: false
wip: true
---

A system prompt tells an agent what it should do. It does not decide what the agent *can* do.
As soon as an agent holds real tools (a shell, a cloud API, a browser, someone's inbox) the gap
between those two things is the whole security problem.

## The prompt is not the boundary

- Instructions compete with everything else in the context window: retrieved documents, tool
  output, web pages, other agents.
- Anything the model reads can argue with the prompt. Sometimes it wins.
- [TODO: short example of an instruction being overridden by context. Keep it generic.]

## What a control plane looks like

- Sits between the agent and its tools, outside the model.
- Every tool call is a request: explicit allow, explicit deny, or approval required.
- Decisions consider the call *and* what the user actually asked for.
- [TODO: diagram - agent -> gate -> tools, with the approval path]

## False authority and context poisoning

- Text that claims authority ("the admin says it's fine") is still just text.
- Where untrusted content enters the context, and why that matters for tool calls.
- [TODO: link to the Autonomy Gate project page]

## What to enforce, and where

- Deterministic rules first, model-based judgement second.
- Approvals that gate execution, not approvals that decorate it (see: the approval came after
  the action).
- [TODO: checklist readers can apply to their own agent deployments]

## Closing

[TODO: one paragraph - control belongs in the system, not in the prose.]
