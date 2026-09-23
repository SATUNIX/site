// Named animation presets. Markup opts in with `data-ascii="<preset>"`.
//
// Timings started from values observed on gatesnotes.com (24fps, random batch sizes, biased
// durations so most glyphs settle fast and a few linger) and were tuned for this site. Text
// presets use the "scramble" reveal: a band of class-matched noise runs ahead of the typing head.

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
	/** The wordmark: a slanted wavefront etches the banner, trailing noise, then the ink boils. */
	"hero-etch": {
		delay: 0.2,
		reveal: { kind: "etch", colsPerSecond: 95, slant: 2.5, trail: 0.22, noise: NOISE },
		cycles: [inkBoil, dropout({ from: 5, to: 10 })],
	},
	/** Monospace labels, eyebrows and short values: typed with a short scramble band. */
	label: {
		reveal: { kind: "scramble", charsPerFrame: { from: 1, to: 3 }, window: 5, interval: 0.05, cursor: "_" },
		cycles: [dropout({ from: 3, to: 6 }, 0.3)],
	},
	/** Dates and other numbers: digits roll before settling. */
	meta: {
		reveal: { kind: "scramble", charsPerFrame: { from: 1, to: 3 }, window: 6, interval: 0.04 },
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
	/** Headings: typed with a scramble band ahead of the head. */
	title: {
		reveal: { kind: "scramble", charsPerFrame: { from: 1, to: 3 }, window: 8, interval: 0.05, cursor: "_" },
	},
	/** Body copy: fast scramble-typing so paragraphs resolve in about a second. */
	copy: {
		fps: 30,
		reveal: { kind: "scramble", charsPerFrame: { from: 6, to: 12 }, window: 24, interval: 0.06, cursor: "_" },
		cycles: [dropout({ from: 12, to: 24 }, 0.35)],
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
