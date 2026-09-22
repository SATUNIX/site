// Astro configuration.
//
// `site` and `base` come from a single typed source (src/config/site.ts) so the same
// values drive canonical URLs, sitemap and RSS. `base` must be '/' for root hosting or
// '/repository/' for a GitHub Pages project site; every internal URL is built with the
// base-path helpers in src/lib/url.ts rather than hard-coded.
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

import { site } from "./src/config/site.ts";

export default defineConfig({
	site: site.url,
	base: site.base || "/",
	output: "static",
	trailingSlash: "always",
	integrations: [
		sitemap({
			// The custom 404 page must never appear in the sitemap.
			filter: (page) => !page.includes("/404"),
		}),
	],
});
