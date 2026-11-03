// Geist Pixel's element-shape axis.
//
// The variable font has a single axis, ELSH, from 0 to 100. Its named instances sit at the values
// below; values in between morph smoothly from one pixel shape to the next, and 100 draws the
// same squares as 0, so animating 0 -> 100 loops without a seam.
//
// The chosen shape is stored under SHAPE_KEY and applied before first paint by the inline script
// in PixelState.astro, which keeps its own copy of SHAPE_NAMES (it cannot import modules).

export const SHAPES = {
	square: 1,
	circle: 20,
	grid: 40,
	triangle: 60,
	line: 80,
} as const;

export type ShapeName = keyof typeof SHAPES;

export const SHAPE_NAMES = Object.keys(SHAPES) as ShapeName[];

export const SHAPE_KEY = "pixel-shape";

export const DEFAULT_SHAPE: ShapeName = "square";

/** The axis wraps: 100 renders the same as 0. */
export const ELSH_PERIOD = 100;

export function isShape(name: unknown): name is ShapeName {
	return typeof name === "string" && Object.hasOwn(SHAPES, name);
}

/** The shape after `name`, wrapping from the last back to the first. */
export function nextShape(name: ShapeName): ShapeName {
	const i = SHAPE_NAMES.indexOf(name);
	return SHAPE_NAMES[(i + 1) % SHAPE_NAMES.length];
}

/** Wrap any axis value into [0, 100). */
export function wrapElsh(value: number): number {
	return ((value % ELSH_PERIOD) + ELSH_PERIOD) % ELSH_PERIOD;
}

/** The named shape whose axis value is nearest `value`, treating the axis as a loop. */
export function nearestShape(value: number): ShapeName {
	const v = wrapElsh(value);
	let best: ShapeName = DEFAULT_SHAPE;
	let bestDist = Infinity;
	for (const name of SHAPE_NAMES) {
		const d = Math.abs(SHAPES[name] - v);
		const dist = Math.min(d, ELSH_PERIOD - d);
		if (dist < bestDist) {
			best = name;
			bestDist = dist;
		}
	}
	return best;
}
