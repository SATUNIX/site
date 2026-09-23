// Content Security Policy helpers (build time only).
//
// Astro hashes the scripts and styles it bundles, but not `is:inline` blocks. Components that
// emit inline code render it from a string with `set:html` and register that exact string's
// hash here, so the policy never needs 'unsafe-inline'. scripts/check-site.mjs verifies that
// every inline block in the build is covered.
import { createHash } from "node:crypto";

import type { AstroGlobal } from "astro";

/** CSP source expression for `content`, e.g. `sha256-...`. */
export function cspHash(content: string): `sha256-${string}` {
	return `sha256-${createHash("sha256").update(content, "utf8").digest("base64")}`;
}

/** Allow an inline `<script>` whose body is exactly `content`, and return it for `set:html`. */
export function inlineScript(astro: AstroGlobal, content: string): string {
	astro.csp?.insertScriptHash(cspHash(content));
	return content;
}

/** Allow an inline `<style>` whose body is exactly `content`, and return it for `set:html`. */
export function inlineStyle(astro: AstroGlobal, content: string): string {
	astro.csp?.insertStyleHash(cspHash(content));
	return content;
}
