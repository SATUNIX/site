// Advance widths of Geist Pixel, for laying out the wordmark at build time without measuring.
//
// Every advance in the font is a whole number of its 38-unit pixel (1000 units per em), and
// the ELSH axis never changes them. ADVANCES lists printable ASCII (0x20..0x7E) in pixels, read
// from GeistPixel-Variable.woff2 (hmtx) with fontTools; regenerate it if the font is updated.

/** One font pixel in em. */
export const PIXEL_EM = 38 / 1000;

/** Cap height in em (OS/2 sCapHeight). */
export const CAP_HEIGHT_EM = 722 / 1000;

// prettier-ignore
const ADVANCES = [
	10, 7, 8, 13, 17, 20, 15, 4, 10, 10, 11, 14, 5, 10, 5, 11,
	15, 13, 17, 16, 18, 15, 17, 15, 17, 17, 7, 6, 14, 14, 14, 14,
	22, 16, 17, 18, 18, 16, 15, 18, 18, 6, 16, 16, 15, 20, 17, 18,
	16, 20, 17, 17, 16, 18, 16, 24, 16, 14, 18, 9, 11, 9, 11, 14,
	7, 15, 15, 14, 15, 14, 10, 16, 15, 10, 9, 14, 10, 20, 15, 14,
	15, 15, 12, 13, 10, 14, 13, 20, 13, 14, 15, 11, 6, 11, 15,
];

/** Advance of one character in font pixels; anything outside printable ASCII counts as "M". */
export function advanceOf(char: string): number {
	const code = char.charCodeAt(0);
	return ADVANCES[code - 0x20] ?? ADVANCES["M".charCodeAt(0) - 0x20];
}

/** Width of `text` in em when set in Geist Pixel with no letter-spacing. */
export function measure(text: string): number {
	let pixels = 0;
	for (const char of text) pixels += advanceOf(char);
	return pixels * PIXEL_EM;
}
