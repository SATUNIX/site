---
title: "Dynamic delegation: letting agent topology follow the problem"
description: "Fixed multi-agent org charts may be the wrong abstraction. What if structure formed around each task instead?"
pubDate: 2026-09-23
tags: [agents, research, soar]
draft: true
---

> DRAFT: outline and working notes. Not for publication yet.

Most multi-agent systems start with an org chart: a planner, a coder, a reviewer, a tester.
The structure is decided before the problem is known. SOAR starts from the opposite end: give
an agent a goal and a plan, and let it decide whether the work fits in one unit or needs to be
split.

## The core loop

1. Receive goal + plan.
2. Can this be completed as one unit of work?
3. If yes, do it. If no, decompose, and delegate each part to a worker built for it.
4. Workers apply the same loop, recursively.

[TODO: diagram of a task tree forming and collapsing]

## Why fixed hierarchies struggle

- Some tasks are one step; some are hundreds. A fixed shape fits neither well.
- [TODO: an example task where a fixed pipeline wasted effort or missed a dependency]

## The hard parts

- **Context routing**: what does each worker need to know, and nothing more?
- **Task-local memory**: state that belongs to a subtask, not the whole run.
- **Healing**: what happens when a worker fails or wanders off.
- **Verification**: "done" has to be checked, not declared.
- [TODO: which of these is solved, which is still open]

## Early observations

[TODO: what has worked and what hasn't. No numbers until they're measured properly.]

## Where it goes next

[TODO: link to the spec / repo if it goes public]
