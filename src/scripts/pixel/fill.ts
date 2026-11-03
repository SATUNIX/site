// Pixel flood fill for hover states: a grid of square cells that grow in from the point where the
// pointer entered and shrink away when it leaves.
//
// Pure state, no DOM. `set()` gives every cell a start delay from its distance to the origin (plus
// a little jitter, so the front looks dithered rather than drawn with a compass), and `step()`
// moves each started cell toward the target. Reversing halfway through is seamless: cells carry
// on from wherever they are.

import type { Rng } from "@/scripts/ascii/random";

export interface FillOptions {
	/** Cell size in px. */
	cell: number;
	/** Front speed in px per second. */
	speed: number;
	/** Seconds for one cell to grow from empty to full. */
	grow: number;
	/** Extra random delay per cell, as a fraction of the time the front takes to cross the box. */
	jitter: number;
}

export const FILL_DEFAULTS: FillOptions = { cell: 12, speed: 2600, grow: 0.09, jitter: 0.25 };

export class PixelFill {
	cols = 0;
	rows = 0;
	/** Per-cell fill in [0, 1]. */
	value = new Float32Array(0);
	/** Per-cell seconds until it starts moving toward the target. */
	delay = new Float32Array(0);
	target: 0 | 1 = 0;
	readonly opts: FillOptions;

	constructor(
		opts: Partial<FillOptions> = {},
		private readonly rng: Rng = Math.random,
	) {
		this.opts = { ...FILL_DEFAULTS, ...opts };
	}

	resize(width: number, height: number): void {
		const { cell } = this.opts;
		const cols = Math.max(1, Math.ceil(width / cell));
		const rows = Math.max(1, Math.ceil(height / cell));
		if (cols === this.cols && rows === this.rows) return;
		this.cols = cols;
		this.rows = rows;
		const full = this.target === 1 ? 1 : 0;
		this.value = new Float32Array(cols * rows).fill(full);
		this.delay = new Float32Array(cols * rows);
	}

	/** Head for `target`, with the front starting at (x, y) px. */
	set(target: 0 | 1, x: number, y: number): void {
		const { cell, speed, jitter } = this.opts;
		this.target = target;
		const span = Math.hypot(this.cols * cell, this.rows * cell) / speed;
		for (let row = 0; row < this.rows; row++) {
			for (let col = 0; col < this.cols; col++) {
				const i = row * this.cols + col;
				const d = Math.hypot((col + 0.5) * cell - x, (row + 0.5) * cell - y);
				this.delay[i] = d / speed + this.rng() * jitter * span;
			}
		}
	}

	/** Advance by `dt` seconds. Returns true until every cell has reached the target. */
	step(dt: number): boolean {
		const rate = dt / this.opts.grow;
		let moving = false;
		for (let i = 0; i < this.value.length; i++) {
			if (this.value[i] === this.target) continue;
			if (this.delay[i] > 0) {
				this.delay[i] -= dt;
				moving = true;
				if (this.delay[i] > 0) continue;
			}
			this.value[i] =
				this.target === 1 ? Math.min(1, this.value[i] + rate) : Math.max(0, this.value[i] - rate);
			if (this.value[i] !== this.target) moving = true;
		}
		return moving;
	}

	/** Mean fill across all cells, in [0, 1]. */
	coverage(): number {
		if (this.value.length === 0) return this.target;
		let sum = 0;
		for (let i = 0; i < this.value.length; i++) sum += this.value[i];
		return sum / this.value.length;
	}

	/** Jump straight to `target` (used when motion is off). */
	snap(target: 0 | 1): void {
		this.target = target;
		this.value.fill(target);
		this.delay.fill(0);
	}
}
