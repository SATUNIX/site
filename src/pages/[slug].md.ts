import type { APIContext } from "astro";

import { markdownPath, pages } from "@/lib/markdown";

// Markdown twins of the top-level pages: /index.md, /work.md, /projects.md, /cv.md, ...
export function getStaticPaths() {
	return pages.map((page) => ({
		params: { slug: markdownPath(page.path).replace(/\.md$/, "") },
		props: { page },
	}));
}

export async function GET({ props }: APIContext) {
	const { page } = props as { page: (typeof pages)[number] };
	return new Response(await page.body(), {
		headers: { "Content-Type": "text/markdown; charset=utf-8" },
	});
}
