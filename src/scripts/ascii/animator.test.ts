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

	it("scramble: class-matched noise ahead of the head, blanks beyond, cursor at the head", () => {
		const text = "abc DEF 123 xyz";
		const anim = new Animator(
			text,
			{ fps: 10, reveal: { kind: "scramble", charsPerFrame: 1, window: 5.5, interval: 0.1, cursor: "_" } },
			seeded(3),
		);
		// After 3 frames: "abc" typed, cursor on "D", noise through "3" (5.5-char window), blanks after.
		const f = anim.frame(0.3);
		expect(f.slice(0, 4)).toBe("abc ");
		expect(f[4]).toBe("_");
		expect(f.slice(5, 7)).toMatch(/^[A-Z]{2}$/);
		expect(f[7]).toBe(" ");
		expect(f.slice(8, 11)).toMatch(/^[0-9]{3}$/);
		expect(f.slice(11)).toBe("    ");
		expect(anim.frame(anim.duration)).toBe(text);
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
	it("renders each word as a printable ASCII rectangle", () => {
		const art = renderBanner("Hello World 42");
		expect(art).toMatch(PRINTABLE);
		const blocks = art.split("\n\n");
		expect(blocks).toHaveLength(3);
		for (const block of blocks) {
			expect(new Set(block.split("\n").map((l) => l.length)).size).toBe(1);
		}
		expect(columnsOf(art)).toBe(Math.max(...art.split("\n").map((l) => l.length)));
	});

	it("stacks words and ignores unsupported characters", () => {
		expect(renderBanner("A").split("\n")).toHaveLength(7);
		expect(renderBanner("A B").split("\n")).toHaveLength(15);
		expect(renderBanner(`A${String.fromCharCode(0xe9)}`)).toBe(renderBanner("A"));
	});
});
