// Single source of truth for site identity and deployment.
//
// Everything here is plain ASCII (enforced by scripts/check-site.mjs). Optional links are
// `null` to leave them off the site entirely rather than render an empty row.

/** Where the site is published, and how its internal links are rooted. */
export interface SiteConfig {
	/** Name shown in the header, page titles and the homepage wordmark. */
	name: string;
	/** One short line under the name. */
	tagline: string;
	/** Default meta description: one sentence. */
	description: string;
	/**
	 * Canonical production origin, no trailing slash and no sub-path.
	 * Used by canonical URLs, the sitemap, RSS and the Markdown twins.
	 */
	url: string;
	/**
	 * Sub-path the site is served from: `""` for root hosting, `"/<repository>/"` for a
	 * GitHub Pages project site.
	 */
	base: string;
	/** Author name for feed metadata, the footer and print output. */
	author: string;
	/** External profiles and the feed. */
	links: SiteLinks;
	/**
	 * Site-root-relative path of the published OpenPGP public key ("keys/public.asc"), or
	 * `null` until a real key is in public/keys/. The fingerprint is derived at build time.
	 */
	pgpKeyPath: string | null;
}

export interface SiteLinks {
	/** Full https URLs, or `null` to leave the link off the site. */
	github: string | null;
	linkedin: string | null;
	gravatar: string | null;
	/** e.g. "mailto:you@example.com", or `null`. */
	contact: string | null;
	/** Feed path relative to the site root; run through the base-path helpers in src/lib/url.ts. */
	rss: string;
}

export const site: SiteConfig = {
	name: "Tony",
	tagline: "Security. Systems. Software.",
	description:
		"Tony: offensive security and security engineering, working across penetration testing, adversary simulation, cloud infrastructure and autonomous AI systems.",
	// GitHub Pages project site for the SATUNIX/site repository. For a custom domain (or a
	// <user>.github.io repository) set url to that origin and base to "".
	url: "https://satunix.github.io",
	base: "/site/",
	author: "Tony",
	links: {
		github: "https://github.com/satunix",
		linkedin: null,
		gravatar: "https://gravatar.com/satunix",
		contact: null,
		rss: "/rss.xml",
	},
	pgpKeyPath: null,
};
