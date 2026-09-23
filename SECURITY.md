# Security policy

This repository builds a static personal website. There is no server, database, login or
user input, so the attack surface is the build pipeline, the dependency tree and the
generated HTML.

## Reporting a vulnerability

Please report privately through
[GitHub private vulnerability reporting](https://github.com/SATUNIX/site/security/advisories/new)
rather than a public issue. Include what you found, where, and how to reproduce it.

You can expect an acknowledgement within a few days. Once a fix is published I am happy to
credit you, unless you prefer otherwise.

## Scope

In scope:

- The published site at <https://satunix.github.io/site/>
- The build and deployment workflows in `.github/workflows/`
- Scripts in `scripts/` and the source in `src/`

Out of scope: GitHub Pages infrastructure itself, and findings that need a compromised
browser or machine.

## Controls in place

- **Content Security Policy.** Every page ships a strict CSP: same-origin only, no inline
  script or style without a build-time hash, no plugins, no framing of forms or base URLs.
  `npm run check:site` fails the build if any inline script or style is not covered.
- **No runtime HTML injection.** The animation runtime writes with `textContent` only.
- **Pinned, least-privilege CI.** Third-party actions are pinned to commit SHAs, the default
  token is read-only, and only the deploy job may write to Pages.
- **Supply chain.** `npm ci` from a committed lockfile, `npm audit` and registry signature
  verification in CI, Dependabot for npm and Actions, and CodeQL analysis.
