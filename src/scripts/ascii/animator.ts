// Frame-by-frame ASCII text animation, independent of the DOM.
//
// The model: the final text is known up front. Every character gets a `revealAt` time; before it
// the character renders as a space (newlines are kept), so the block always occupies its final
// size and nothing reflows. On top of that, "cycle" layers make chosen characters flicker between
// their real glyph and random glyphs for a short, randomised time before they settle.
//
// `frame(t)` is pure with respect to wall-clock time: callers pass seconds since start.

import { pick, sample, sampleInt, type RangeLike, type Rng } from "./random";

export type Reveal =
	/** Type left-to-right, a random batch of characters per frame. */
	| { kind: "type"; charsPerFrame: RangeLike }
	/**
	 * Type left-to-right with a band of scrambled glyphs running ahead of the typing head (in the
	 * spirit of GSAP's ScrambleText). Noise keeps each character's class: lowercase stays
	 * lowercase, digits stay digits, spaces stay spaces, so word shapes hold while they resolve.
	 */
	| {
			kind: "scramble";
			charsPerFrame: RangeLike;
			/** Characters of noise ahead of the head. */
			window: number;
			/** Seconds between noise re-rolls (lower = busier). */
			interval: number;
			/** Glyph drawn at the typing head, e.g. "_". */
			cursor?: string;
	  }
	/** A diagonal wavefront sweeps across the grid, trailing noise glyphs behind it. */
	| { kind: "etch"; colsPerSecond: number; slant: number; trail: number; noise: string }
	/** Everything is visible immediately (cycles only). */
	| { kind: "none" };

export interface CycleLayer {
	/** Affect every Nth eligible character (N sampled per step). */
	every: RangeLike;
	/** Only characters contained in this string are eligible. */
	filter?: string;
	/** Glyph pool shown while cycling. Default " ". */
	output?: string;
	/** Seconds between glyph swaps. */
	interval: RangeLike;
	/** Seconds a character keeps cycling. */
	duration: RangeLike;
	/** Seconds after the character is revealed before cycling starts. */
	delay?: RangeLike;
	/** Probability each swap shows the real character. Default 0.5. */
	origRatio?: number;
}

export interface AnimationSpec {
	/** Visual updates per second. Default 24. */
	fps?: number;
	/** Seconds before anything is revealed. */
	delay?: number;
	reveal: Reveal;
	cycles?: CycleLayer[];
}

interface Cycle {
	index: number;
	start: number;
	end: number;
	interval: number;
	origRatio: number;
	output: string;
	nextSwap: number;
	glyph: string;
}

const isBlank = (ch: string) => ch === " " || ch === "\n";

const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";
const SYMBOLS = "#%*+=-:./";

/** Noise pool that matches a character's class. */
function poolFor(ch: string): string {
	if (ch >= "a" && ch <= "z") return LOWER;
	if (ch >= "A" && ch <= "Z") return UPPER;
	if (ch >= "0" && ch <= "9") return DIGITS;
	return SYMBOLS;
}

export class Animator {
	readonly text: string;
	readonly fps: number;
	private readonly chars: string[];
	private readonly revealAt: Float64Array;
	private readonly spec: AnimationSpec;
	private readonly rng: Rng;
	private cycles: Cycle[] = [];
	private readonly settleTime: number;
	private lastT = 0;
	/** Scramble noise, re-rolled per cell once per `interval` bucket. */
	private noise: string[] = [];
	private noiseBucket = new Float64Array(0);

	constructor(text: string, spec: AnimationSpec, rng: Rng = Math.random) {
		this.text = text;
		this.chars = [...text];
		this.spec = spec;
		this.rng = rng;
		this.fps = spec.fps ?? 24;
		this.revealAt = this.scheduleReveal();
		for (const layer of spec.cycles ?? []) this.addLayer(layer);
		this.settleTime = this.cycles.reduce(
			(max, c) => Math.max(max, c.end),
			this.revealAt.reduce((max, t) => (Number.isFinite(t) ? Math.max(max, t) : max), 0) +
				this.trail(),
		);
	}

	/** Seconds after which (absent new perturbations) every character shows its final glyph. */
	get duration(): number {
		return this.settleTime;
	}

	/** True once time `t` is past every reveal and every cycle. */
	done(t: number): boolean {
		return t >= this.settleTime && this.cycles.every((c) => t >= c.end);
	}

	/** Render the block as it looks at `t` seconds after start. */
	frame(t: number): string {
		this.lastT = t;
		const out = this.chars.slice();
		const trail = this.trail();
		const { reveal } = this.spec;
		const noise = reveal.kind === "etch" ? reveal.noise : "";
		const lead = reveal.kind === "scramble" ? this.scrambleLead(reveal) : 0;
		const bucket = reveal.kind === "scramble" ? Math.floor(t / reveal.interval) : 0;
		let cursorAt = -1;

		for (let i = 0; i < out.length; i++) {
			if (isBlank(out[i])) continue;
			const at = this.revealAt[i];
			if (t < at) {
				if (cursorAt < 0 && reveal.kind === "scramble") cursorAt = i;
				out[i] = lead > 0 && t >= at - lead ? this.noiseAt(i, bucket) : " ";
			} else if (trail > 0 && t < at + trail) out[i] = pick(noise, this.rng);
		}
		if (cursorAt >= 0 && reveal.kind === "scramble" && reveal.cursor) {
			out[cursorAt] = reveal.cursor;
		}

		for (const c of this.cycles) {
			if (t < c.start || t >= c.end || t < this.revealAt[c.index]) continue;
			if (t >= c.nextSwap) {
				c.glyph =
					this.rng() < c.origRatio ? this.chars[c.index] : pick(c.output, this.rng);
				c.nextSwap = t + c.interval;
			}
			out[c.index] = c.glyph;
		}
		if (this.cycles.length > 64 && this.cycles.some((c) => t >= c.end)) {
			this.cycles = this.cycles.filter((c) => t < c.end);
		}
		return out.join("");
	}

	/**
	 * Start short-lived flicker on specific characters (pointer ripples). Blank cells are ignored
	 * so the block's silhouette never changes.
	 */
	perturb(indices: Iterable<number>, layer: Omit<CycleLayer, "every" | "filter">): void {
		const now = this.lastT;
		for (const index of indices) {
			const ch = this.chars[index];
			if (ch === undefined || isBlank(ch)) continue;
			if (this.cycles.some((c) => c.index === index && now < c.end)) continue;
			this.cycles.push(this.makeCycle(index, now, layer));
		}
	}

	/** Seconds of reveal time covered by the scramble window (window / average typing rate). */
	private scrambleLead(reveal: Extract<Reveal, { kind: "scramble" }>): number {
		const perFrame =
			typeof reveal.charsPerFrame === "number"
				? reveal.charsPerFrame
				: (reveal.charsPerFrame.from + reveal.charsPerFrame.to) / 2;
		return reveal.window / Math.max(1, perFrame * this.fps);
	}

	private noiseAt(index: number, bucket: number): string {
		if (this.noiseBucket.length !== this.chars.length) {
			this.noiseBucket = new Float64Array(this.chars.length).fill(-1);
			this.noise = new Array<string>(this.chars.length).fill(" ");
		}
		if (this.noiseBucket[index] !== bucket) {
			this.noiseBucket[index] = bucket;
			this.noise[index] = pick(poolFor(this.chars[index]), this.rng);
		}
		return this.noise[index];
	}

	private trail(): number {
		return this.spec.reveal.kind === "etch" ? this.spec.reveal.trail : 0;
	}

	private scheduleReveal(): Float64Array {
		const { reveal } = this.spec;
		const start = this.spec.delay ?? 0;
		const times = new Float64Array(this.chars.length).fill(start);
		const visible: number[] = [];
		this.chars.forEach((ch, i) => {
			if (!isBlank(ch)) visible.push(i);
		});
		const frame = 1 / this.fps;

		switch (reveal.kind) {
			case "none":
				return times;
			case "type":
			case "scramble": {
				let f = 0;
				for (let k = 0; k < visible.length; f++) {
					const batch = sampleInt(reveal.charsPerFrame, this.rng, true);
					for (let b = 0; b < batch && k < visible.length; b++, k++) {
						times[visible[k]] = start + f * frame;
					}
				}
				return times;
			}
			case "etch": {
				let row = 0;
				let col = 0;
				this.chars.forEach((ch, i) => {
					if (ch === "\n") {
						row++;
						col = 0;
						return;
					}
					times[i] = start + (col + row * reveal.slant) / reveal.colsPerSecond;
					col++;
				});
				return times;
			}
		}
	}

	private addLayer(layer: CycleLayer): void {
		let i = sampleInt(layer.every, this.rng, true) - 1;
		while (i < this.chars.length) {
			const ch = this.chars[i];
			if (!isBlank(ch) && (!layer.filter || layer.filter.includes(ch))) {
				this.cycles.push(this.makeCycle(i, this.revealAt[i], layer));
			}
			i += sampleInt(layer.every, this.rng, true);
		}
	}

	private makeCycle(
		index: number,
		from: number,
		layer: Omit<CycleLayer, "every" | "filter">,
	): Cycle {
		const start = from + sample(layer.delay ?? 0, this.rng);
		return {
			index,
			start,
			end: start + sample(layer.duration, this.rng),
			interval: Math.max(1 / 60, sample(layer.interval, this.rng)),
			origRatio: layer.origRatio ?? 0.5,
			output: layer.output ?? " ",
			nextSwap: start,
			glyph: this.chars[index],
		};
	}
}
