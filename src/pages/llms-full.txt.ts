import { llmsFullTxt } from "@/lib/markdown";

// Every page and post as one Markdown document.
export async function GET() {
	return new Response(await llmsFullTxt(), {
		headers: { "Content-Type": "text/plain; charset=utf-8" },
	});
}
