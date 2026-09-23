import { llmsTxt } from "@/lib/markdown";

// https://llmstxt.org index of the site for agents.
export async function GET() {
	return new Response(await llmsTxt(), {
		headers: { "Content-Type": "text/plain; charset=utf-8" },
	});
}
