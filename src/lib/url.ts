// The ONLY module that reads `import.meta.env.BASE_URL`.
//
// Every internal link, asset reference and canonical URL must go through one of these
// helpers so the same build works at the domain root and under a `/<repository>/` base
// path (GitHub Pages project sites). Never write a raw `href="/..."` or `src="/..."`
// outside this file and src/config/site.ts.
import { site } from "@/config/site";

/**
 * Normalise an Astro raw base into a prefix with no trailing slash.
 * `""`, `"/"` and `undefined` all collapse to `""` (root hosting); `"/repo/"` -> `"/repo"`.
 * Pure so it can be unit-tested without touching the build environment.
 */
export function normalizeBase(base: string | undefined | null): string {
	if (!base || base === "/") return "";
	let value = base.startsWith("/") ? base : `/${base}`;
	while (value.endsWith("/")) value = value.slice(0, -1);
	return value === "/" ? "" : value;
}

/**
 * Join a normalised base with a site-relative path.
 * `joinWithBase("", "/")` -> `/`; `joinWithBase("/repo", "blog/")` -> `/repo/blog/`.
 * Pure: the base-path safety tests exercise `""`, `"/"` and `"/repo/"` directly.
 */
export function joinWithBase(base: string, p: string): string {
	const segment = String(p ?? "/")
		.replace(/^\.\//, "")
		.replace(/^\/+/, "");
	return segment === "" ? `${base}/` : `${base}/${segment}`;
}

/** The normalised base prefix for the current build (e.g. `""` or `"/repo"`). */
export function basePath(): string {
	return normalizeBase(import.meta.env.BASE_URL);
}

/** A base-path-safe internal URL. `path("/")` -> `/` or `/repo/`. */
export function path(p: string = "/"): string {
	return joinWithBase(basePath(), p);
}

/** A base-path-safe static asset URL (fonts, favicon, key downloads). */
export function asset(p: string): string {
	return path(p);
}

/** An absolute URL for canonical tags, RSS and the sitemap. */
export function absolute(p: string = "/"): string {
	return new URL(path(p), site.url).toString();
}
