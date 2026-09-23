// Homepage wordmark geometry, shared by the page (which emits the CSS into <head>, where it
// can be hashed into the CSP) and HeroArtwork (which renders the banners).
import { columnsOf, renderBanner } from "@/scripts/ascii/font";

export interface HeroBanner {
	art: string;
	/** Half-width version (one character per pixel) so the name stays legible on narrow screens. */
	artCompact: string;
	/** Per-name sizing and the wide/compact switch. Emit via BaseLayout's `inlineCss`. */
	css: string;
}

export function heroBanner(text: string): HeroBanner {
	const art = renderBanner(text);
	const artCompact = renderBanner(text, { pixelWidth: 1 });
	// Swap to the compact banner where the wide one would render below 7px type
	// (JetBrains Mono advances 0.6em per glyph). Depends on the name, so it is computed here.
	const switchAt = Math.ceil(columnsOf(art) * 0.6 * 7);
	// Selectors carry an extra class to outrank Astro's scoped (attribute-qualified) rules.
	const css = `.hero__frame { --cols: ${columnsOf(art)}; --cols-compact: ${columnsOf(artCompact)}; }
@container hero (max-width: ${switchAt}px) {
	.hero__frame .hero__art.hero__art--wide { display: none; }
	.hero__frame .hero__art.hero__art--compact { display: block; }
}`;
	return { art, artCompact, css };
}
