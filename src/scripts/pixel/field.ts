// The dot-matrix field behind the wordmark: a grid of cells, each with a brightness in [0, 1].
//
// Pure state, no DOM. Two layers make up what is drawn (`level()` is the brighter of the two):
//   heat  - stamped where the pointer is (and by ambient sparkle); decays exponentially, so a stamp
//           fades over about HALF_LIFE * 6 seconds and the loop can stop once everything is cold.
//   wave  - rings expanding from a click or tap, recomputed every frame from the pulses alone:
//           a sharp leading edge with a short tail behind it, fading as the ring grows.

import type { Rng } from "@/scripts/ascii/random";

export interface Pulse {
	x: number;
	y: number;
	/** Seconds since the pulse started. */
	age: number;
}

/** Seconds for heat to halve. */
export const HALF_LIFE = 0.09;
/** How fast a pulse ring travels, px per second. */
export const PULSE_SPEED = 900;
/** How far ahead of the ring the wave starts, px. */
export const WAVE_AHEAD = 8;
/** How far the wave's tail trails behind the ring, px. */
export const WAVE_BEHIND = 64;
/** Heat below this is treated as cold and cleared. */
export const COLD = 0.02;

/** Wave brightness at signed distance `s` from a ring (positive = ahead of it). */
export function waveProfile(s: number): number {
	if (s > WAVE_AHEAD || s < -WAVE_BEHIND) return 0;
	if (s >= 0) return 1 - s / WAVE_AHEAD;
	const k = 1 + s / WAVE_BEHIND;
	return k * k;
}

export class DotField {
	cols = 0;
	rows = 0;
	width = 0;
	height = 0;
	heat = new Float32Array(0);
	wave = new Float32Array(0);
	pulses: Pulse[] = [];

	constructor(readonly cell: number) {}

	/** Fit the grid to a `width` x `height` px box. Clears everything. */
	resize(width: number, height: number): void {
		this.width = width;
		this.height = height;
		this.cols = Math.max(1, Math.ceil(width / this.cell) + 1);
		this.rows = Math.max(1, Math.ceil(height / this.cell) + 1);
		this.heat = new Float32Array(this.cols * this.rows);
		this.wave = new Float32Array(this.cols * this.rows);
		this.pulses = [];
	}

	/** Brightness of cell `i`: the brighter of its heat and the wave passing through it. */
	level(i: number): number {
		return Math.max(this.heat[i], this.wave[i]);
	}

	/** Raise heat in a disc of `radius` px around (x, y), strongest at the centre. */
	stamp(x: number, y: number, radius: number, strength = 1): void {
		const { cell, cols, rows, heat } = this;
		const r = radius / cell;
		const cx = x / cell;
		const cy = y / cell;
		const c0 = Math.max(0, Math.floor(cx - r));
		const c1 = Math.min(cols - 1, Math.ceil(cx + r));
		const r0 = Math.max(0, Math.floor(cy - r));
		const r1 = Math.min(rows - 1, Math.ceil(cy + r));
		for (let row = r0; row <= r1; row++) {
			for (let col = c0; col <= c1; col++) {
				const d = Math.hypot(col - cx, row - cy);
				if (d >= r) continue;
				const i = row * cols + col;
				heat[i] = Math.max(heat[i], (1 - d / r) * strength);
			}
		}
	}

	/** Start a ring that expands from (x, y). */
	pulse(x: number, y: number): void {
		this.pulses.push({ x, y, age: 0 });
	}

	/** Heat a random cell, for ambient sparkle. */
	sparkle(rng: Rng = Math.random): void {
		if (this.heat.length === 0) return;
		const i = Math.floor(rng() * this.heat.length);
		this.heat[i] = Math.max(this.heat[i], 0.35 + 0.65 * rng());
	}

	/** Radius in px that a pulse of this age has reached. */
	static ringRadius(age: number): number {
		return age * PULSE_SPEED;
	}

	/**
	 * How strongly a pulse ring is passing through (x, y) right now: 1 on the ring, falling to 0
	 * `band` px either side of it. Used to nudge the wordmark's letters as a ring crosses them.
	 */
	static ringStrength(pulse: Pulse, x: number, y: number, band: number): number {
		const d = Math.abs(Math.hypot(x - pulse.x, y - pulse.y) - DotField.ringRadius(pulse.age));
		return d < band ? 1 - d / band : 0;
	}

	/** Distance past which a ring has left the box entirely. */
	private get reach(): number {
		return Math.hypot(this.width, this.height) + WAVE_BEHIND;
	}

	/**
	 * Advance by `dt` seconds: heat decays, pulses grow and the wave layer is redrawn from them.
	 * Returns true while anything is still lit or moving.
	 */
	step(dt: number): boolean {
		const { cell, cols, rows, heat, wave } = this;
		const keep = Math.pow(0.5, dt / HALF_LIFE);
		let lit = false;
		for (let i = 0; i < heat.length; i++) {
			if (heat[i] === 0) continue;
			heat[i] *= keep;
			if (heat[i] < COLD) heat[i] = 0;
			else lit = true;
		}

		wave.fill(0);
		const reach = this.reach;
		for (const p of this.pulses) p.age += dt;
		this.pulses = this.pulses.filter((p) => DotField.ringRadius(p.age) < reach);
		for (const p of this.pulses) {
			const radius = DotField.ringRadius(p.age);
			// Rings fade as they spread, so a pulse dies out rather than hitting the edge.
			const strength = Math.sqrt(1 - radius / reach);
			const outer = radius + WAVE_AHEAD;
			const inner = Math.max(0, radius - WAVE_BEHIND);
			const c0 = Math.max(0, Math.floor((p.x - outer) / cell));
			const c1 = Math.min(cols - 1, Math.ceil((p.x + outer) / cell));
			const r0 = Math.max(0, Math.floor((p.y - outer) / cell));
			const r1 = Math.min(rows - 1, Math.ceil((p.y + outer) / cell));
			for (let row = r0; row <= r1; row++) {
				for (let col = c0; col <= c1; col++) {
					const d = Math.hypot(col * cell - p.x, row * cell - p.y);
					if (d < inner || d > outer) continue;
					const v = waveProfile(d - radius) * strength;
					const i = row * cols + col;
					if (v > wave[i]) wave[i] = v;
				}
			}
		}
		return lit || this.pulses.length > 0;
	}
}
