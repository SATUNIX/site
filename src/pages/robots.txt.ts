import { absolute } from "@/lib/url";
import { beta } from "@/lib/variant";

// Allow everything; point crawlers and agents at the sitemap and the llms.txt index.
// The beta (a preview, every page noindex) has no sitemap and turns crawlers away.
export function GET() {
	if (beta) {
		return new Response("User-agent: *\nDisallow: /\n", {
			headers: { "Content-Type": "text/plain; charset=utf-8" },
		});
	}
	const body = `User-agent: *
Allow: /

Sitemap: ${absolute("sitemap-index.xml")}

# Agents: a Markdown index of this site is at ${absolute("llms.txt")}
`;
	return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
