---
title: "Why more agent autonomy creates a security architecture problem"
description: "Authority, delegation, trust boundaries and least privilege, once the thing acting on your behalf makes its own decisions."
pubDate: 2026-09-23
tags: [ai-security, agents, architecture]
draft: true
---

> DRAFT: outline and working notes. Not for publication yet.

Every increase in agent autonomy is also a delegation of authority. Security architecture has
decades of practice with delegation between people and services. Agents break some of its
assumptions.

## Authority without intent

- A service does what it was coded to do. An agent decides.
- [TODO: what that changes for access control]

## Delegation chains

- User -> agent -> subagent -> tool -> external system.
- Where does the original user's authority stop?
- [TODO: example chain and where it should be cut]

## Trust boundaries move

- Content the agent reads becomes an input to its decisions.
- [TODO: mapping boundaries for an agent deployment]

## Least privilege for agents

- Scope tools per task, not per agent.
- Short-lived credentials.
- [TODO: practical patterns]

## Monitoring and governance

[TODO: what to log, who reviews it]
