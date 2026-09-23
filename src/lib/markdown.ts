// Plain-Markdown renderings of every page, for agents and other text-first readers.
//
// Built from the same data as the HTML pages (src/data, src/config, the blog collection), so the
// two can't drift. Served as `/<page>.md`, indexed by `/llms.txt` (https://llmstxt.org) and
// concatenated into `/llms-full.txt`. All links are absolute so the files stand alone.

import { site } from "@/config/site";
import { cv } from "@/data/cv";
import { profile } from "@/data/profile";
import { projects, projectsIntro } from "@/data/projects";
import { engagements, workIntro } from "@/data/work";
import { getPublishedPosts, type BlogPost } from "@/lib/posts";
import { absolute } from "@/lib/url";

const iso = (d: Date) => d.toISOString().slice(0, 10);
const bullets = (items: string[]) => items.map((i) => `- ${i}`).join("\n");

/** Site-relative path of a page's Markdown twin: "/" -> "index.md", "blog/x/" -> "blog/x.md". */
export function markdownPath(pagePath: string): string {
	const trimmed = pagePath.replace(/^\/+|\/+$/g, "");
	return `${trimmed || "index"}.md`;
}

export interface MdPage {
	/** Site-relative HTML path, e.g. "work/". */
	path: string;
	title: string;
	summary: string;
	body: () => Promise<string>;
}

const doc = (title: string, htmlPath: string, body: string) =>
	`# ${title}\n\nSource: ${absolute(htmlPath)}\n\n${body.trim()}\n`;

export function postMarkdown(post: BlogPost): string {
	const { title, description, pubDate, updatedDate, tags, wip } = post.data;
	const meta = [
		`Published: ${iso(pubDate)}`,
		updatedDate ? `Updated: ${iso(updatedDate)}` : null,
		tags.length ? `Tags: ${tags.join(", ")}` : null,
		wip ? "Status: DRAFT, work in progress (outline and notes, not the finished post)" : null,
	]
		.filter(Boolean)
		.join("\n");
	return doc(title, `blog/${post.id}/`, `> ${description}\n\n${meta}\n\n${post.body ?? ""}`);
}

export const pages: MdPage[] = [
	{
		path: "/",
		title: site.name,
		summary: "Introduction and key information.",
		body: async () => {
			const facts = profile.facts
				.filter((f) => f.value)
				.map((f) => `- ${f.key}: ${f.value}`)
				.join("\n");
			return doc(
				`${site.name}: ${site.tagline}`,
				"/",
				`${profile.intro.join("\n\n")}\n\n## Key information\n\n${facts}\n\n## Areas\n\n` +
					profile.areas
						.map((a) => `- [${a.name}](${absolute(markdownPath(a.page))}): ${a.text}`)
						.join("\n"),
			);
		},
	},
	{
		path: "work/",
		title: "Work",
		summary: "Representative engagement types (types of work, never specific clients).",
		body: async () =>
			doc(
				"Work",
				"work/",
				`${workIntro}\n\n` +
					engagements
						.map((e) => `## ${e.title}\n\n${e.summary}\n\nCovers:\n\n${bullets(e.covers)}`)
						.join("\n\n"),
			),
	},
	{
		path: "projects/",
		title: "Projects",
		summary: "Personal research and experiments: agent security, autonomous systems, private AI.",
		body: async () =>
			doc(
				"Projects",
				"projects/",
				`${projectsIntro.join("\n\n")}\n\nGitHub: ${site.links.github ?? "n/a"}\n\n` +
					projects
						.map(
							(p) =>
								`## ${p.title}\n\n_${p.tagline}_ (status: ${p.status})\n\n${p.summary}\n\nThemes:\n\n${bullets(p.themes)}` +
								(p.href ? `\n\nLink: ${p.href}` : ""),
						)
						.join("\n\n"),
			),
	},
	{
		path: "cv/",
		title: "CV",
		summary: "Roles, capabilities, credentials and skills.",
		body: async () =>
			doc(
				`CV: ${site.name}`,
				"cv/",
				[
					cv.summary ?? "",
					cv.note ?? "",
					"## Experience",
					cv.experience
						.map((r) => `- ${r.period}: ${r.title}${r.org ? `, ${r.org}` : ""}`)
						.join("\n"),
					"## Capabilities",
					bullets(cv.capabilities),
					"## Credentials",
					cv.qualifications.map((q) => `- ${q.name}: ${q.status}`).join("\n"),
					"## Skills",
					cv.skills.map((g) => `- ${g.label}: ${g.items.join(", ")}`).join("\n"),
				]
					.filter(Boolean)
					.join("\n\n"),
			),
	},
	{
		path: "links/",
		title: "Links",
		summary: "Profiles and feed.",
		body: async () => {
			const links = Object.entries({
				GitHub: site.links.github,
				LinkedIn: site.links.linkedin,
				Gravatar: site.links.gravatar,
				Contact: site.links.contact,
				RSS: absolute(site.links.rss),
			})
				.filter(([, href]) => href)
				.map(([label, href]) => `- ${label}: ${href}`)
				.join("\n");
			return doc("Links", "links/", links);
		},
	},
	{
		path: "blog/",
		title: "Writing",
		summary: "Index of posts, newest first.",
		body: async () => {
			const posts = await getPublishedPosts();
			const list = posts
				.map(
					(p) =>
						`- [${p.data.title}](${absolute(markdownPath(`blog/${p.id}/`))}) (${iso(p.data.pubDate)}${p.data.wip ? ", draft" : ""}): ${p.data.description}`,
				)
				.join("\n");
			return doc("Writing", "blog/", list || "No posts yet.");
		},
	},
];

/** The /llms.txt index. */
export async function llmsTxt(): Promise<string> {
	const posts = await getPublishedPosts();
	const pageLinks = pages
		.map((p) => `- [${p.title}](${absolute(markdownPath(p.path))}): ${p.summary}`)
		.join("\n");
	const postLinks = posts
		.map(
			(p) =>
				`- [${p.data.title}](${absolute(markdownPath(`blog/${p.id}/`))})${p.data.wip ? " (draft)" : ""}: ${p.data.description}`,
		)
		.join("\n");
	return `# ${site.name}

> ${site.description}

Personal site of ${site.name}: ${site.tagline} Every page is also available as Markdown at the
same path with a .md extension (listed below). Work entries describe types of work repeated
across many engagements, never specific clients. Posts marked (draft) are work in progress.

## Pages

${pageLinks}

## Writing

${postLinks || "- No posts yet."}

## Optional

- [Everything in one file](${absolute("llms-full.txt")}): all pages and posts concatenated
- [RSS feed](${absolute(site.links.rss)}): finished posts only
- [Sitemap](${absolute("sitemap-index.xml")})
`;
}

/** The /llms-full.txt bundle: every page and post, in order. */
export async function llmsFullTxt(): Promise<string> {
	const parts = await Promise.all(pages.map((p) => p.body()));
	const posts = (await getPublishedPosts()).map(postMarkdown);
	return [...parts, ...posts].join("\n---\n\n");
}
