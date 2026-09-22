// Single source of truth for site identity and deployment.
//
// Every value that the operator must supply is left as a literal `PLACEHOLDER...` string
// (or `null`, for optional links) so that `scripts/check-site.mjs`, the README and the UI
// can all detect an unconfigured site instead of silently shipping invented content.
// Never replace a placeholder with a guess.

/** Where the site is published, and how its internal links are rooted. */
export interface SiteConfig {
	/**
	 * Your name or the site title. Shown in the header and page titles.
	 * FILL IN: replace "PLACEHOLDER NAME".
	 */
	name: string;
	/**
	 * One short line under the name; plain ASCII, no decoration.
	 * FILL IN: replace "PLACEHOLDER TAGLINE".
	 */
	tagline: string;
	/**
	 * Default meta description (one sentence, plain ASCII).
	 * FILL IN: replace "PLACEHOLDER DESCRIPTION".
	 */
	description: string;
	/**
	 * Canonical production origin, no trailing slash and no sub-path.
	 * Used by the sitemap, RSS and absolute URLs.
	 * FILL IN: replace "PLACEHOLDER" with your domain, e.g. "https://example.com".
	 */
	url: string;
	/**
	 * Sub-path the site is served from. `""` (or `"/"`) means root hosting.
	 * For a GitHub Pages project site set this to `"/<repository>/"`.
	 * This is the base half of the deploy decision, not personal content, so it is a
	 * documented default rather than a PLACEHOLDER: set it explicitly when you know where
	 * the site will live.
	 */
	base: string;
	/**
	 * Author name used for feed metadata and print footers.
	 * FILL IN: replace "PLACEHOLDER AUTHOR".
	 */
	author: string;
	/** External profiles and the derived feed URL. */
	links: SiteLinks;
	/**
	 * Path (relative to the site root) of the published OpenPGP public key.
	 * FILL IN: set to "keys/public.asc" once you drop the key in public/keys/.
	 * Stays `null` until a real key exists; never invent key material.
	 */
	pgpKeyPath: string | null;
	/**
	 * `false` until every PLACEHOLDER above is replaced. Components use this to show an
	 * explicit "unconfigured" state instead of a broken or misleading page.
	 * FILL IN: flip to `true` once the site is configured.
	 */
	isConfigured: boolean;
}

export interface SiteLinks {
	/** FILL IN: full https URL, or leave `null` to show an unconfigured state. */
	github: string | null;
	/** FILL IN: full https URL, or leave `null` to show an unconfigured state. */
	linkedin: string | null;
	/** FILL IN: e.g. "mailto:you@example.com", or leave `null` to hide it. */
	contact: string | null;
	/**
	 * Feed path relative to the site root. Leave as-is; components run it through the
	 * base-path helpers in src/lib/url.ts, so it works at the domain root and under
	 * `/<repository>/` alike.
	 */
	rss: string;
}

export const site: SiteConfig = {
	name: "PLACEHOLDER NAME",
	tagline: "PLACEHOLDER TAGLINE",
	description: "PLACEHOLDER DESCRIPTION",
	url: "https://PLACEHOLDER.example",
	base: "",
	author: "PLACEHOLDER AUTHOR",
	links: {
		github: null,
		linkedin: null,
		contact: null,
		rss: "/rss.xml",
	},
	pgpKeyPath: null,
	isConfigured: false,
};
