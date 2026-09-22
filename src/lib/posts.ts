import { getCollection, type CollectionEntry } from "astro:content";

export type BlogPost = CollectionEntry<"blog">;

/**
 * A post is published when it is not a draft in a production build. In dev every entry is
 * visible so drafts can be previewed; production excludes them from routes, indexes, RSS
 * and the sitemap (they all read from `getPublishedPosts`).
 */
export function isPublished(
	post: BlogPost,
	production: boolean = import.meta.env.PROD,
): boolean {
	return production ? post.data.draft !== true : true;
}

/** Published posts, newest first. Stable tiebreak on `id` for deterministic builds. */
export async function getPublishedPosts(): Promise<BlogPost[]> {
	const posts: BlogPost[] = await getCollection("blog");
	return posts
		.filter((post: BlogPost) => isPublished(post))
		.sort((a: BlogPost, b: BlogPost) => {
			const byDate = b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
			return byDate !== 0 ? byDate : a.id.localeCompare(b.id);
		});
}
