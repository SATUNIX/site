import { describe, expect, it } from "vitest";

import { Animator } from "./animator";
import { columnsOf, renderBanner } from "./font";
import { PRESETS } from "./presets";
import { seeded } from "./random";

const ART = "+--------+\n| #### : |\n| #  # : |\n+--------+";
const PRINTABLE = /^[\x20-\x7e\n]*$/;

describe("Animator", () => {
	for (const [name, spec] of Object.entries(PRESETS)) {
		it(`${name}: keeps the block shape and settles on the exact text`, () => {
			const anim = new Animator(ART, spec, seeded(7));
			const lengths = ART.split("\n").map((l) => l.length);
			for (let t = 0; t < anim.duration; t += 1 / 24) {
				const frame = anim.frame(t);
				expect(frame.split("\n").map((l) => l.length)).toEqual(lengths);
				expect(frame).toMatch(PRINTABLE);
			}
			expect(anim.done(anim.duration)).toBe(true);
			expect(anim.frame(anim.duration)).toBe(ART);
		});
	}

	it("renders unrevealed characters as spaces before the delay", () => {
		const anim = new Animator("abc\ndef", { delay: 1, reveal: { kind: "type", charsPerFrame: 1 } });
		expect(anim.frame(0)).toBe("   \n   ");
	});

	it("types in order, a batch per frame", () => {
		const anim = new Animator("abcd", { fps: 10, reveal: { kind: "type", charsPerFrame: 2 } });
		expect(anim.frame(0)).toBe("ab  ");
		expect(anim.frame(0.1)).toBe("abcd");
	});

	it("perturb only touches non-blank characters and settles again", () => {
		const anim = new Animator("a b", { reveal: { kind: "none" } }, seeded(1));
		anim.frame(5);
		anim.perturb([0, 1, 2], { output: "#", origRatio: 0, interval: 0.05, duration: 0.2 });
		expect(anim.frame(5)).toBe("# #");
		expect(anim.done(5.1)).toBe(false);
		expect(anim.frame(5.3)).toBe("a b");
		expect(anim.done(5.3)).toBe(true);
	});
});

describe("renderBanner", () => {
	it("produces a printable ASCII rectangle", () => {
		const art = renderBanner("Hello World 42");
		const widths = new Set(art.split("\n").map((l) => l.length));
		expect(widths.size).toBe(1);
		expect(art).toMatch(PRINTABLE);
		expect(columnsOf(art)).toBe([...widths][0]);
	});

	it("stacks words and ignores unsupported characters", () => {
		expect(renderBanner("A").split("\n")).toHaveLength(7);
		expect(renderBanner("A B").split("\n")).toHaveLength(13);
		expect(renderBanner("Aé")).toBe(renderBanner("A"));
	});
});
