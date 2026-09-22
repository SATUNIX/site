import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// Local Markdown blog. Publishing = add a file under src/content/blog/, preview, commit,
// build. No database, login or runtime Markdown renderer.
const blog = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		tags: z.array(z.string()).default([]),
		// draft: dev preview only, never built for production.
		draft: z.boolean().default(false),
		// wip: published, but clearly labelled as a draft, noindexed and kept out of RSS.
		wip: z.boolean().default(false),
	}),
});

export const collections = { blog };
