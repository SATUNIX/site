---
title: "Pentesting cloud IAM as a graph problem"
description: "Roles, trust policies, STS and cross-account access form a graph. Testing it means finding paths, not misconfigurations."
pubDate: 2026-09-23
tags: [cloud, aws, offensive-security]
draft: true
---

> DRAFT: outline and working notes. Not for publication yet. Keep all examples synthetic.

A list of IAM findings rarely shows the real risk. The risk is in the paths: this role can
assume that one, which can read this secret, which unlocks that account. Cloud identity is a
graph, and testing it well means walking it.

## Nodes and edges

- Nodes: principals, roles, resources, accounts.
- Edges: trust policies, permissions, role assumption, resource policies.
- [TODO: synthetic diagram]

## Starting from an assumed breach

- What the compromised workload can see first: metadata, credentials, its own permissions.
- [TODO: enumeration approach, generic]

## Finding paths

- Privilege escalation edges.
- Cross-account trust.
- [TODO: approach and tooling, no client detail]

## Reporting paths, not findings

- Show the chain end to end.
- Recommend the cut that breaks the most paths.
- [TODO: synthetic example of a path write-up]
