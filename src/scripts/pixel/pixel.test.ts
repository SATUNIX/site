import { describe, expect, it } from "vitest";

import { seeded } from "@/scripts/ascii/random";

import { COLD, DotField, PULSE_SPEED, WAVE_AHEAD, WAVE_BEHIND, waveProfile } from "./field";
import { PixelFill } from "./fill";
import { advanceOf, measure, PIXEL_EM } from "./metrics";
import { isShape, nearestShape, nextShape, SHAPE_NAMES, SHAPES, wrapElsh } from "./shapes";
import { commonPrefix, complete, execute, type ShellData } from "./shell";

describe("shapes", () => {
	it("maps every shape to a distinct axis value inside [0, 100)", () => {
		const values = SHAPE_NAMES.map((n) => SHAPES[n]);
		expect(new Set(values).size).toBe(values.length);
		for (const v of values) expect(v >= 0 && v < 100).toBe(true);
	});

	it("cycles through every shape and wraps", () => {
		let name = SHAPE_NAMES[0];
		const seen = [name];
		for (let i = 1; i < SHAPE_NAMES.length; i++) seen.push((name = nextShape(name)));
		expect(seen).toEqual(SHAPE_NAMES);
		expect(nextShape(SHAPE_NAMES[SHAPE_NAMES.length - 1])).toBe(SHAPE_NAMES[0]);
	});

	it("validates names", () => {
		expect(isShape("circle")).toBe(true);
		expect(isShape("hexagon")).toBe(false);
		expect(isShape("toString")).toBe(false);
	});

	it("treats the axis as a loop", () => {
		expect(wrapElsh(-5)).toBe(95);
		expect(wrapElsh(105)).toBe(5);
		expect(nearestShape(21)).toBe("circle");
		expect(nearestShape(98)).toBe("square");
	});
});

describe("metrics", () => {
	it("measures in em from whole font pixels", () => {
		// T, O, N, Y = 16 + 18 + 17 + 14 pixels.
		expect(measure("TONY")).toBeCloseTo(65 * PIXEL_EM, 10);
		expect(measure("")).toBe(0);
	});

	it("falls back to M for characters outside printable ASCII", () => {
		expect(advanceOf(String.fromCharCode(0xe9))).toBe(advanceOf("M"));
	});
});

describe("DotField", () => {
	it("sizes the grid to cover the box", () => {
		const f = new DotField(10);
		f.resize(95, 40);
		expect(f.cols).toBe(11);
		expect(f.rows).toBe(5);
		expect(f.heat.length).toBe(55);
	});

	it("stamps heat that is strongest at the centre and decays to cold", () => {
		const f = new DotField(10);
		f.resize(200, 200);
		f.stamp(100, 100, 50);
		const centre = f.heat[10 * f.cols + 10];
		const edge = f.heat[10 * f.cols + 14];
		expect(centre).toBeCloseTo(1, 5);
		expect(edge).toBeGreaterThan(0);
		expect(edge).toBeLessThan(centre);
		let active = true;
		for (let i = 0; i < 200 && active; i++) active = f.step(1 / 30);
		expect(active).toBe(false);
		expect(f.heat.every((h) => h === 0 || h >= COLD)).toBe(true);
	});

	it("moves a pulse ring outward at PULSE_SPEED, sharp ahead and trailing behind", () => {
		const f = new DotField(10);
		f.resize(1000, 1000);
		f.pulse(0, 0);
		f.step(0.2);
		const radius = DotField.ringRadius(0.2);
		expect(radius).toBeCloseTo(0.2 * PULSE_SPEED, 5);
		const at = (px: number) => f.level(Math.round(px / 10));
		expect(at(radius)).toBeGreaterThan(0.8);
		expect(at(radius + 20)).toBe(0);
		expect(at(radius - 30)).toBeGreaterThan(0);
		expect(at(radius - 30)).toBeLessThan(at(radius));
		expect(at(radius / 2)).toBe(0);
		// The wave is not heat: it never lingers once the ring has moved on.
		expect(f.heat.every((h) => h === 0)).toBe(true);
	});

	it("shapes the wave with a short lead and a longer tail", () => {
		expect(waveProfile(0)).toBe(1);
		expect(waveProfile(WAVE_AHEAD + 1)).toBe(0);
		expect(waveProfile(-WAVE_BEHIND - 1)).toBe(0);
		expect(waveProfile(-WAVE_BEHIND / 2)).toBeCloseTo(0.25, 5);
	});

	it("drops pulses once they leave the box", () => {
		const f = new DotField(10);
		f.resize(100, 100);
		f.pulse(50, 50);
		for (let i = 0; i < 60; i++) f.step(1 / 30);
		expect(f.pulses.length).toBe(0);
	});
});

describe("PixelFill", () => {
	it("floods from the origin outward and reports coverage", () => {
		const fill = new PixelFill({ cell: 10, speed: 1000, grow: 0.05, jitter: 0 }, seeded(1));
		fill.resize(200, 50);
		fill.set(1, 0, 25);
		fill.step(0.06);
		const near = fill.value[2 * fill.cols];
		const far = fill.value[2 * fill.cols + fill.cols - 1];
		expect(near).toBe(1);
		expect(far).toBe(0);
		let moving = true;
		for (let i = 0; i < 100 && moving; i++) moving = fill.step(1 / 60);
		expect(moving).toBe(false);
		expect(fill.coverage()).toBe(1);
	});

	it("reverses mid-way without jumping", () => {
		const fill = new PixelFill({ cell: 10, speed: 500, grow: 0.1, jitter: 0.3 }, seeded(7));
		fill.resize(300, 60);
		fill.set(1, 150, 30);
		fill.step(0.15);
		const mid = fill.coverage();
		expect(mid).toBeGreaterThan(0);
		expect(mid).toBeLessThan(1);
		fill.set(0, 300, 30);
		fill.step(1 / 120);
		expect(Math.abs(fill.coverage() - mid)).toBeLessThan(0.1);
		for (let i = 0; i < 200; i++) fill.step(1 / 60);
		expect(fill.coverage()).toBe(0);
	});

	it("snaps when motion is off", () => {
		const fill = new PixelFill({}, seeded(3));
		fill.resize(100, 100);
		fill.snap(1);
		expect(fill.coverage()).toBe(1);
		expect(fill.step(1 / 60)).toBe(false);
	});
});

describe("shell", () => {
	const data: ShellData = {
		home: "/site/",
		here: "/work/",
		dirs: [
			{ name: "work/", aliases: [], href: "/site/work/", note: "engagement types" },
			{ name: "lab/", aliases: ["projects"], href: "/site/projects/", note: "research" },
			{ name: "writing/", aliases: ["blog"], href: "/site/blog/", note: "posts" },
			{ name: "links/", aliases: [], href: "/site/links/", note: "profiles" },
			{ name: "cv.txt", aliases: ["cv"], href: "/site/cv/", note: "the CV" },
		],
		posts: [
			{ slug: "first-post", title: "First post", date: "2026-01-02", href: "/site/blog/first-post/" },
			{ slug: "second-post", title: "Second post", date: "2026-01-01", href: "/site/blog/second-post/" },
		],
		work: ["Cloud assumed-breach assessments"],
		lab: [{ title: "Autonomy Gate", status: "ongoing" }],
		links: [{ key: "github", href: "https://github.com/example" }],
		whoami: ["tony"],
	};

	it("lists the root, directories and posts", () => {
		expect(execute("ls", data).lines.map((l) => l.href)).toEqual(data.dirs.map((d) => d.href));
		expect(execute("ls work/", data).lines[0].text).toBe("Cloud assumed-breach assessments");
		expect(execute("ls projects", data).lines[0].text).toContain("Autonomy Gate");
		const posts = execute("ls writing", data).lines;
		expect(posts[0].text).toBe("[01] 2026-01-02  First post");
		expect(posts[0].href).toBe("/site/blog/first-post/");
		expect(execute("ls nope", data).lines[0].tone).toBe("err");
	});

	it("navigates with cd, open and cat", () => {
		expect(execute("cd blog/", data).action).toEqual({ kind: "navigate", href: "/site/blog/" });
		expect(execute("cd", data).action).toEqual({ kind: "navigate", href: "/site/" });
		expect(execute("cd ..", data).action).toEqual({ kind: "navigate", href: "/site/" });
		expect(execute("open 2", data).action).toEqual({ kind: "navigate", href: "/site/blog/second-post/" });
		expect(execute("open first-post", data).action?.kind).toBe("navigate");
		expect(execute("open 9", data).lines[0].tone).toBe("err");
		expect(execute("cat cv.txt", data).action).toEqual({ kind: "navigate", href: "/site/cv/" });
		expect(execute("cd cv.txt", data).action).toBeUndefined();
		expect(execute("cat work/", data).action).toBeUndefined();
	});

	it("changes shape, theme and motion", () => {
		expect(execute("shape circle", data).action).toEqual({ kind: "shape", name: "circle" });
		expect(execute("shape", data).action).toEqual({ kind: "shape", name: "next" });
		expect(execute("shape hexagon", data).action).toBeUndefined();
		expect(execute("theme dark", data).action).toEqual({ kind: "theme", value: "dark" });
		expect(execute("theme purple", data).action).toBeUndefined();
		expect(execute("motion off", data).action).toEqual({ kind: "motion", value: "off" });
	});

	it("handles housekeeping and unknown commands", () => {
		expect(execute("   ", data).lines).toEqual([]);
		expect(execute("clear", data).action).toEqual({ kind: "clear" });
		expect(execute("exit", data).action).toEqual({ kind: "close" });
		expect(execute("pwd", data).lines[0].text).toBe("~/work/");
		expect(execute("frobnicate", data).lines[0].text).toContain("command not found");
		expect(execute("help", data).lines.length).toBeGreaterThan(5);
	});

	it("completes commands and arguments", () => {
		expect(complete("wh", data)).toEqual(["whoami"]);
		expect(complete("cd w", data)).toEqual(["cd work/", "cd writing/"]);
		expect(complete("cat ", data)).toEqual(["cat cv.txt"]);
		expect(complete("shape c", data)).toEqual(["shape circle"]);
		expect(complete("nope x", data)).toEqual([]);
		expect(commonPrefix(complete("cd w", data))).toBe("cd w");
		expect(commonPrefix(["open first-post"])).toBe("open first-post");
	});
});
