#!/usr/bin/env node
// Offline site checks. Run by `npm run check:site` and by `npm run verify`.
//
//   1. ASCII purity    - every text file under src/ must stay within printable US-ASCII
//                        (0x20..0x7E, plus newline/tab). The brief forbids Unicode glyphs,
//                        arrows, block shading, smart punctuation, emoji and icon fonts.
//   2. Base-path safety- no raw root-absolute href/src outside the allowlisted base-path
//                        modules; use the helpers in src/lib/url.ts instead.
//   3. Built routes    - when dist/ exists, the expected routes were emitted (this is what
//                        catches a draft silently disappearing from a production build).
//
// It does NOT validate HTML, DNS, deployment or comment semantics. Node built-ins only.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.join(root, "src");
const distDir = path.join(root, "dist");

const TEXT_EXTENSIONS = new Set([
	".astro",
	".ts",
	".tsx",
	".js",
	".mjs",
	".cjs",
	".css",
	".md",
	".markdown",
	".json",
	".txt",
	".html",
]);
const HREF_EXTENSIONS = new Set([
	".astro",
	".ts",
	".tsx",
	".js",
	".mjs",
	".html",
]);
// Files allowed to contain root-absolute URLs: they *are* the base-path layer.
const HREF_ALLOWLIST = new Set(["lib/url.ts", "config/site.ts"]);
// Routes every production build must emit.
const EXPECTED_ROUTES = [
	"index.html",
	"blog/index.html",
	"cv/index.html",
	"links/index.html",
	"404.html",
	"rss.xml",
	"sitemap-index.xml",
];

const errors = [];
const rel = (file) => path.relative(root, file).split(path.sep).join("/");

function walk(dir) {
	const found = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) found.push(...walk(full));
		else if (TEXT_EXTENSIONS.has(path.extname(entry.name))) found.push(full);
	}
	return found;
}

function checkAscii(file) {
	const text = fs.readFileSync(file, "utf8");
	const lines = text.split("\n");
	for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
		const line = lines[lineIndex];
		for (let col = 0; col < line.length; col++) {
			const code = line.charCodeAt(col);
			const allowed = code === 0x09 || (code >= 0x20 && code <= 0x7e);
			if (!allowed) {
				errors.push(
					`${rel(file)}:${lineIndex + 1}:${col + 1}: non-ASCII character U+${code.toString(16).toUpperCase().padStart(4, "0")}`,
				);
				break; // one error per line is enough to act on
			}
		}
	}
}

function checkRootAbsoluteHref(file) {
	if (HREF_ALLOWLIST.has(rel(file).replace(/^src\//, ""))) return;
	if (!HREF_EXTENSIONS.has(path.extname(file))) return;
	const lines = fs.readFileSync(file, "utf8").split("\n");
	const pattern = /(?:href|src)\s*=\s*(["'])\/(?!\/)/;
	for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
		if (pattern.test(lines[lineIndex])) {
			errors.push(
				`${rel(file)}:${lineIndex + 1}: raw root-absolute href/src; use path()/asset() from src/lib/url.ts`,
			);
		}
	}
}

function checkDistRoutes() {
	if (!fs.existsSync(distDir)) return;
	for (const route of EXPECTED_ROUTES) {
		if (!fs.existsSync(path.join(distDir, route))) {
			errors.push(`dist/${route}: expected build output is missing`);
		}
	}
}

if (!fs.existsSync(srcDir)) {
	errors.push("src/: directory is missing");
} else {
	const files = walk(srcDir);
	for (const file of files) {
		checkAscii(file);
		checkRootAbsoluteHref(file);
	}
}
checkDistRoutes();

if (errors.length > 0) {
	console.error(`[check-site] ${errors.length} problem(s):`);
	for (const error of errors) console.error(`  ${error}`);
	process.exit(1);
}
console.log("[check-site] all checks passed");
