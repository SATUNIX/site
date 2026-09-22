// Random helpers shared by the ASCII effects.
//
// A `RangeLike` is either a fixed number or `{ from, to, bias }`. With `bias` the unit random
// value is raised to that power before scaling, so a large bias keeps most samples near `from`
// and lets only a few reach `to` (most characters settle quickly, a handful linger).

export type Rng = () => number;

export interface Range {
	from: number;
	to: number;
	bias?: number;
}

export type RangeLike = number | Range;

/** Sample a float from a range. */
export function sample(range: RangeLike, rng: Rng = Math.random): number {
	if (typeof range === "number") return range;
	let unit = rng();
	if (range.bias) unit = Math.pow(unit, range.bias);
	return range.from + unit * (range.to - range.from);
}

/** Sample an integer from an inclusive range; never below 1 when `min1` is set. */
export function sampleInt(
	range: RangeLike,
	rng: Rng = Math.random,
	min1 = false,
): number {
	const value =
		typeof range === "number"
			? Math.round(range)
			: range.from + Math.floor(rng() * (range.to - range.from + 1));
	return min1 ? Math.max(1, value) : value;
}

/** Pick one character from a pool. */
export function pick(pool: string, rng: Rng = Math.random): string {
	return pool.charAt(Math.floor(rng() * pool.length));
}

/** Small seeded PRNG (mulberry32) so tests and replays can be deterministic. */
export function seeded(seed: number): Rng {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
