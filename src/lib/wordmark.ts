// Sizing for PixelWordmark: the name's width in em, measured at build time from the font's
// advance widths, so CSS can scale it to fill its container exactly (font-size = 100cqi / width).
// Emitted through BaseLayout's `inlineCss` (hashed into the CSP) rather than a style attribute.
import { measure } from "@/scripts/pixel/metrics";

export function wordmarkCss(text: string): string {
	return `.wordmark { --advance: ${measure(text.toUpperCase()).toFixed(4)}; }`;
}
