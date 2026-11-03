// Astro configuration.
//
// `site` and `base` come from a single typed source (src/config/site.ts) so the same
// values drive canonical URLs, sitemap and RSS. `base` must be '/' for root hosting or
// '/repository/' for a GitHub Pages project site; every internal URL is built with the
// base-path helpers in src/lib/url.ts rather than hard-coded.
import { satteri } from "@astrojs/markdown-satteri";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

import { site } from "./src/config/site.ts";

// The Geist Pixel beta is a second build of the same source (scripts/build-beta.mjs sets
// PUBLIC_SITE_VARIANT=beta): served from `betaPath` under the base, written to the matching
// folder of dist/, and never in the sitemap (its pages are noindex).
const beta = process.env.PUBLIC_SITE_VARIANT === "beta";
const stableBase = site.base || "/";
const betaDir = site.betaPath.replace(/^\/+|\/+$/g, "");

export default defineConfig({
	site: site.url,
	base: beta ? `${stableBase.replace(/\/?$/, "/")}${betaDir}/` : stableBase,
	outDir: beta ? `./dist/${betaDir}` : "./dist",
	output: "static",
	trailingSlash: "always",
	security: {
		// Static hosting cannot set response headers, so Astro emits the policy as a
		// <meta http-equiv> tag and hashes every script and style it renders. Anything not
		// hashed (including inline `style=""` attributes) is blocked; check-site verifies this.
		csp: {
			algorithm: "SHA-256",
			directives: [
				"default-src 'self'",
				"img-src 'self' data:",
				"font-src 'self'",
				"connect-src 'self'",
				"object-src 'none'",
				"base-uri 'self'",
				"form-action 'none'",
				"upgrade-insecure-requests",
			],
		},
	},
	markdown: {
		// Smart quotes and dashes are non-ASCII; the brief keeps all rendered text printable ASCII.
		processor: satteri({ features: { smartPunctuation: false } }),
		// Prism highlights with classes; Shiki's inline style attributes would be blocked by the
		// CSP. Token colours live in src/styles/tokens.css.
		syntaxHighlight: "prism",
	},
	integrations: beta
		? []
		: [
				sitemap({
					// The custom 404 page must never appear in the sitemap.
					filter: (page) => !page.includes("/404"),
				}),
			],
});
