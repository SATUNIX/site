import type { APIContext } from "astro";

import { postMarkdown } from "@/lib/markdown";
import { getPublishedPosts, type BlogPost } from "@/lib/posts";

// Markdown twin of each post: /blog/<id>.md
export async function getStaticPaths() {
	const posts = await getPublishedPosts();
	return posts.map((post) => ({ params: { id: post.id }, props: { post } }));
}

export function GET({ props }: APIContext) {
	const { post } = props as { post: BlogPost };
	return new Response(postMarkdown(post), {
		headers: { "Content-Type": "text/markdown; charset=utf-8" },
	});
}
