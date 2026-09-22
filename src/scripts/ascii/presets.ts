// Named animation presets. Markup opts in with `data-ascii="<preset>"`.
//
// Timings started from values observed on gatesnotes.com (24fps, random batch sizes, biased
// durations so most glyphs settle fast and a few linger) and were tuned for this site.

import type { AnimationSpec, CycleLayer } from "./animator";

/** Glyphs used for noise. Printable ASCII only. */
export const NOISE = "#%:.'+=*-";

/** The shimmer that makes '#' ink boil through lighter glyphs as it settles. */
const inkBoil: CycleLayer = {
	every: { from: 1, to: 4 },
	filter: "#",
	output: " #:%",
	interval: { from: 0.05, to: 0.1 },
	duration: { from: 0.1, to: 0.9, bias: 6 },
	delay: { from: 0.05, to: 0.1 },
};

/** Sparse flicker to blank: reads as an uneven print head. */
const dropout = (every: CycleLayer["every"], maxDuration = 0.5): CycleLayer => ({
	every,
	output: " ",
	interval: { from: 0.05, to: 0.1 },
	duration: { from: 0.1, to: maxDuration, bias: 6 },
	delay: { from: 0.05, to: 0.1 },
});

export const PRESETS = {
	/** Hero mode 1: a slanted wavefront etches the banner, trailing noise. */
	"hero-etch": {
		delay: 0.2,
		reveal: { kind: "etch", colsPerSecond: 95, slant: 2.5, trail: 0.22, noise: NOISE },
		cycles: [inkBoil, dropout({ from: 5, to: 10 })],
	},
	/** Hero mode 2: everything appears as noise, then locks in roughly left to right. */
	"hero-decrypt": {
		delay: 0.2,
		reveal: { kind: "type", charsPerFrame: { from: 70, to: 110 } },
		cycles: [
			{
				every: 1,
				output: NOISE,
				origRatio: 0.12,
				interval: { from: 0.04, to: 0.09 },
				duration: { from: 0.35, to: 1.3, bias: 2 },
			},
		],
	},
	/** Hero mode 3: glyphs land in random order across the block. */
	"hero-scatter": {
		delay: 0.2,
		reveal: { kind: "scatter", charsPerFrame: { from: 25, to: 55 } },
		cycles: [
			{
				every: 1,
				output: NOISE,
				origRatio: 0,
				interval: { from: 0.03, to: 0.07 },
				duration: { from: 0.05, to: 0.5, bias: 3 },
			},
			inkBoil,
		],
	},
	/** Monospace labels, eyebrows and nav-scale text. */
	label: {
		reveal: { kind: "type", charsPerFrame: { from: 1, to: 3 } },
		cycles: [dropout({ from: 2, to: 4 }, 0.35)],
	},
	/** Dates and other numbers: digits roll before settling. */
	meta: {
		reveal: { kind: "type", charsPerFrame: { from: 1, to: 4 } },
		cycles: [
			{
				every: 1,
				filter: "0123456789",
				output: " 0123456789",
				origRatio: 0,
				interval: { from: 0.02, to: 0.04 },
				duration: { from: 0.1, to: 0.4, bias: 1.6 },
			},
		],
	},
	/** Proportional headings: quick typing with a light flicker. */
	title: {
		reveal: { kind: "type", charsPerFrame: { from: 2, to: 5 } },
		cycles: [dropout({ from: 3, to: 6 }, 0.25)],
	},
	/** Short blocks of supporting copy. Fast: never make a reader wait. */
	copy: {
		fps: 30,
		reveal: { kind: "type", charsPerFrame: { from: 8, to: 16 } },
	},
	/** Multi-line ASCII art: line by line, then the ink boils. */
	art: {
		reveal: { kind: "lines", linesPerFrame: 1 },
		cycles: [inkBoil],
	},
} satisfies Record<string, AnimationSpec>;

export type PresetName = keyof typeof PRESETS;

export function isPreset(name: string | undefined): name is PresetName {
	return name !== undefined && Object.hasOwn(PRESETS, name);
}

/** Pointer ripple: short noise flicker on characters near the pointer. */
export const RIPPLE: Omit<CycleLayer, "every" | "filter"> = {
	output: NOISE,
	origRatio: 0.3,
	interval: { from: 0.04, to: 0.09 },
	duration: { from: 0.15, to: 0.8, bias: 2 },
};
