import rss from "@astrojs/rss";
import type { APIContext } from "astro";

import { site } from "@/config/site";
import { getPublishedPosts } from "@/lib/posts";
import { absolute } from "@/lib/url";

export async function GET(_context: APIContext) {
	const posts = await getPublishedPosts();
	return rss({
		title: site.name,
		description: site.description,
		site: absolute("/"),
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.pubDate,
			link: absolute(`blog/${post.id}/`),
			categories: post.data.tags,
		})),
	});
}
