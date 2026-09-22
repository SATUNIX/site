// A tiny 5-row bitmap font that renders words as a shaded ASCII banner.
//
// Runs at build time (Astro frontmatter) so the wordmark is real text in the HTML before any
// script loads. Output uses printable ASCII only: '#' for ink, ':' for the ground, and '.' / "'"
// for the drop shadow that gives the letters depth.

const GLYPHS: Record<string, string[]> = {
	A: [".XXX.", "X...X", "XXXXX", "X...X", "X...X"],
	B: ["XXXX.", "X...X", "XXXX.", "X...X", "XXXX."],
	C: [".XXXX", "X....", "X....", "X....", ".XXXX"],
	D: ["XXXX.", "X...X", "X...X", "X...X", "XXXX."],
	E: ["XXXXX", "X....", "XXXX.", "X....", "XXXXX"],
	F: ["XXXXX", "X....", "XXXX.", "X....", "X...."],
	G: [".XXXX", "X....", "X..XX", "X...X", ".XXXX"],
	H: ["X...X", "X...X", "XXXXX", "X...X", "X...X"],
	I: ["XXX", ".X.", ".X.", ".X.", "XXX"],
	J: ["..XXX", "...X.", "...X.", "X..X.", ".XX.."],
	K: ["X...X", "X..X.", "XXX..", "X..X.", "X...X"],
	L: ["X....", "X....", "X....", "X....", "XXXXX"],
	M: ["X...X", "XX.XX", "X.X.X", "X...X", "X...X"],
	N: ["X...X", "XX..X", "X.X.X", "X..XX", "X...X"],
	O: [".XXX.", "X...X", "X...X", "X...X", ".XXX."],
	P: ["XXXX.", "X...X", "XXXX.", "X....", "X...."],
	Q: [".XXX.", "X...X", "X.X.X", "X..X.", ".XX.X"],
	R: ["XXXX.", "X...X", "XXXX.", "X..X.", "X...X"],
	S: [".XXXX", "X....", ".XXX.", "....X", "XXXX."],
	T: ["XXXXX", "..X..", "..X..", "..X..", "..X.."],
	U: ["X...X", "X...X", "X...X", "X...X", ".XXX."],
	V: ["X...X", "X...X", "X...X", ".X.X.", "..X.."],
	W: ["X...X", "X...X", "X.X.X", "XX.XX", "X...X"],
	X: ["X...X", ".X.X.", "..X..", ".X.X.", "X...X"],
	Y: ["X...X", ".X.X.", "..X..", "..X..", "..X.."],
	Z: ["XXXXX", "...X.", "..X..", ".X...", "XXXXX"],
	"0": [".XXX.", "X..XX", "X.X.X", "XX..X", ".XXX."],
	"1": [".X.", "XX.", ".X.", ".X.", "XXX"],
	"2": ["XXXX.", "....X", ".XXX.", "X....", "XXXXX"],
	"3": ["XXXX.", "....X", ".XXX.", "....X", "XXXX."],
	"4": ["X...X", "X...X", "XXXXX", "....X", "....X"],
	"5": ["XXXXX", "X....", "XXXX.", "....X", "XXXX."],
	"6": [".XXX.", "X....", "XXXX.", "X...X", ".XXX."],
	"7": ["XXXXX", "....X", "...X.", "..X..", "..X.."],
	"8": [".XXX.", "X...X", ".XXX.", "X...X", ".XXX."],
	"9": [".XXX.", "X...X", ".XXXX", "....X", ".XXX."],
	"-": ["...", "...", "XXX", "...", "..."],
	".": [".", ".", ".", ".", "X"],
	"'": ["X", "X", ".", ".", "."],
	" ": ["..", "..", "..", "..", ".."],
};

const ROWS = 5;

/** Letters of one line as a boolean pixel grid, one blank pixel between letters. */
function pixelsFor(line: string): boolean[][] {
	const grid: boolean[][] = Array.from({ length: ROWS }, () => []);
	const letters = [...line.toUpperCase()].filter((c) => c in GLYPHS);
	letters.forEach((letter, index) => {
		const glyph = GLYPHS[letter];
		for (let r = 0; r < ROWS; r++) {
			for (const px of glyph[r]) grid[r].push(px === "X");
			if (index < letters.length - 1) grid[r].push(false);
		}
	});
	return grid;
}

export interface BannerOptions {
	/** Blank pixels of ground around the letters. Default 1. */
	margin?: number;
}

/**
 * Render text as a shaded banner. Each word goes on its own line block so long names stay
 * narrow; every row is padded to the same width so the block is a clean rectangle.
 */
export function renderBanner(text: string, options: BannerOptions = {}): string {
	const margin = options.margin ?? 1;
	const words = text.trim().split(/\s+/).filter(Boolean);
	const blocks = words.map(pixelsFor);
	const width = Math.max(0, ...blocks.map((b) => b[0].length)) + margin * 2;

	// Stack word blocks with one blank pixel row between them, then pad to a rectangle.
	const blank = () => Array<boolean>(width).fill(false);
	const rows: boolean[][] = [];
	for (let m = 0; m < margin; m++) rows.push(blank());
	blocks.forEach((block, index) => {
		for (const row of block) {
			const padded = blank();
			row.forEach((on, x) => (padded[x + margin] = on));
			rows.push(padded);
		}
		if (index < blocks.length - 1) rows.push(blank());
	});
	for (let m = 0; m < margin; m++) rows.push(blank());

	const on = (r: number, c: number) => rows[r]?.[c] === true;
	return rows
		.map((row, r) =>
			row
				.map((ink, c) => {
					// Each pixel is two characters wide so letters keep a square-ish aspect.
					if (ink) return "##";
					const above = on(r - 1, c);
					const left = above ? "." : ":";
					const right = on(r, c + 1) ? "'" : above ? "." : ":";
					return left + right;
				})
				.join(""),
		)
		.join("\n");
}

/** Width in characters of the widest line of a block of text. */
export function columnsOf(text: string): number {
	return Math.max(0, ...text.split("\n").map((line) => line.length));
}
