import { absolute } from "@/lib/url";

// Allow everything; point crawlers and agents at the sitemap and the llms.txt index.
export function GET() {
	const body = `User-agent: *
Allow: /

Sitemap: ${absolute("sitemap-index.xml")}

# Agents: a Markdown index of this site is at ${absolute("llms.txt")}
`;
	return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
