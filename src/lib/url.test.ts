import { afterEach, describe, expect, it, vi } from "vitest";

import { site } from "@/config/site";

import {
	absolute,
	asset,
	basePath,
	joinWithBase,
	normalizeBase,
	path,
	sitePath,
	stableUrl,
} from "./url";

// Whatever origin src/config/site.ts is set to (the URL API normalises and lowercases it).
const origin = new URL(site.url).origin;

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("normalizeBase", () => {
	it("collapses root and empty bases to an empty prefix", () => {
		expect(normalizeBase("")).toBe("");
		expect(normalizeBase("/")).toBe("");
		expect(normalizeBase(undefined)).toBe("");
		expect(normalizeBase(null)).toBe("");
	});

	it("keeps a sub-path without a trailing slash", () => {
		expect(normalizeBase("/repo/")).toBe("/repo");
		expect(normalizeBase("/repo")).toBe("/repo");
		expect(normalizeBase("repo/")).toBe("/repo");
		expect(normalizeBase("/deeply/nested/")).toBe("/deeply/nested");
	});
});

describe("joinWithBase", () => {
	it("builds root-safe URLs from an empty base", () => {
		expect(joinWithBase("", "/")).toBe("/");
		expect(joinWithBase("", "blog/")).toBe("/blog/");
		expect(joinWithBase("", "/blog/")).toBe("/blog/");
		expect(joinWithBase("", "./fonts/x.woff2")).toBe("/fonts/x.woff2");
	});

	it("builds repo-safe URLs from a sub-path base", () => {
		expect(joinWithBase("/repo", "/")).toBe("/repo/");
		expect(joinWithBase("/repo", "blog/")).toBe("/repo/blog/");
		expect(joinWithBase("/repo", "/blog/")).toBe("/repo/blog/");
		expect(joinWithBase("/repo", "./fonts/x.woff2")).toBe(
			"/repo/fonts/x.woff2",
		);
	});
});

describe("base-path-safe helpers", () => {
	it("uses the root base from the default build environment", () => {
		vi.stubEnv("BASE_URL", "/");
		expect(basePath()).toBe("");
		expect(path("/")).toBe("/");
		expect(path("blog/")).toBe("/blog/");
		expect(asset("fonts/jetbrains-mono/a.woff2")).toBe(
			"/fonts/jetbrains-mono/a.woff2",
		);
		expect(asset("keys/public.asc")).toBe("/keys/public.asc");
	});

	it("prefixes every URL when the build uses a sub-path base", () => {
		vi.stubEnv("BASE_URL", "/repo/");
		expect(basePath()).toBe("/repo");
		expect(path("/")).toBe("/repo/");
		expect(path("blog/")).toBe("/repo/blog/");
		expect(asset("keys/public.asc")).toBe("/repo/keys/public.asc");
		expect(absolute("blog/")).toBe(`${origin}/repo/blog/`);
	});

	it("builds absolute URLs against the configured origin", () => {
		vi.stubEnv("BASE_URL", "/");
		expect(absolute("/")).toBe(`${origin}/`);
		expect(absolute("blog/")).toBe(`${origin}/blog/`);
	});
});

describe("beta helpers", () => {
	const stableRoot = new URL(joinWithBase(normalizeBase(site.base), "/"), site.url).toString();

	it("points at the stable site whatever base this build uses", () => {
		vi.stubEnv("BASE_URL", `${site.base}${site.betaPath}`);
		expect(stableUrl("/")).toBe(stableRoot);
		expect(stableUrl("work/")).toBe(`${stableRoot}work/`);
		expect(stableUrl("/blog/post/")).toBe(`${stableRoot}blog/post/`);
	});

	it("strips the current build's base from a pathname", () => {
		vi.stubEnv("BASE_URL", "/repo/beta/");
		expect(sitePath("/repo/beta/")).toBe("/");
		expect(sitePath("/repo/beta/work/")).toBe("/work/");
		vi.stubEnv("BASE_URL", "/");
		expect(sitePath("/work/")).toBe("/work/");
	});
});
