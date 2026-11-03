// DOM runtime for the Geist Pixel layer (beta build only).
//
// Markup contract:
//   [data-field]           a section with a canvas.field-canvas behind it: a dot-matrix field that
//                          lights up under the pointer, pulses on click or tap, and drives the
//                          shape of each letter of an optional [data-wordmark] inside it.
//   [data-fill]            a row or tile that floods with accent pixels on hover and keyboard focus;
//                          [data-lit] is set once the fill covers most of it (CSS flips the text).
//   [data-shape-toggle]    a button that steps the site-wide pixel shape; [data-shape-label] inside
//                          shows the current name.
//   [data-clock][data-tz]  a live local clock for an IANA time zone.
//   dialog[data-shell]     the site shell (see ./shell-dom.ts).
//
// The site-wide shape is `<html data-shape>`, which CSS maps to the --elsh custom property and
// transitions, so every Geist Pixel heading morphs at once. Only `<html data-motion="on">`
// animates; when motion is paused or reduced, the fields draw a still grid and hovers fall back to
// the plain CSS states. One requestAnimationFrame loop runs, and only while something moves.

import { DotField } from "./field";
import { PixelFill } from "./fill";
import {
	DEFAULT_SHAPE,
	isShape,
	nearestShape,
	nextShape,
	SHAPE_KEY,
	wrapElsh,
	type ShapeName,
} from "./shapes";
import { initShell } from "./shell-dom";

const html = document.documentElement;
const motionOn = () => html.dataset.motion === "on";
const THEME_KEY = "theme";

const store = {
	set(key: string, value: string | null): void {
		try {
			if (value === null) localStorage.removeItem(key);
			else localStorage.setItem(key, value);
		} catch {
			// Storage unavailable (private mode): the choice lasts for this page only.
		}
	},
};

/* ---------- One shared frame loop ---------- */

/** A frame callback: `dt` in seconds. Return false to stop being called. */
type Task = (dt: number) => boolean;

const tasks = new Set<Task>();
let rafId = 0;
let lastFrame = 0;

function wake(task: Task): void {
	tasks.add(task);
	if (rafId) return;
	lastFrame = performance.now();
	rafId = requestAnimationFrame(loop);
}

function loop(now: number): void {
	rafId = 0;
	// Clamp so a long gap (background tab, debugger) never makes the simulation jump.
	const dt = Math.min(0.05, Math.max(0, (now - lastFrame) / 1000));
	lastFrame = now;
	for (const task of [...tasks]) if (!task(dt)) tasks.delete(task);
	if (tasks.size > 0) rafId = requestAnimationFrame(loop);
}

/* ---------- Theme tokens for canvas drawing ---------- */

const colors = { dot: "", hot: "", fill: "" };
const repaints = new Set<() => void>();

function readColors(): void {
	const cs = getComputedStyle(html);
	colors.dot = cs.getPropertyValue("--pixel-dot").trim() || "rgba(0, 0, 0, 0.2)";
	colors.hot = cs.getPropertyValue("--pixel-hot").trim() || "#4f00ff";
	colors.fill = cs.getPropertyValue("--pixel-fill").trim() || "#c4ff0d";
	for (const repaint of repaints) repaint();
}

/** The site-wide axis value right now, including any shape transition in progress. */
function globalElsh(): number {
	const value = parseFloat(getComputedStyle(html).getPropertyValue("--elsh"));
	return Number.isFinite(value) ? value : 1;
}

/** Called whenever <html data-motion> changes. */
const motionListeners = new Set<() => void>();

const dprOf = () => Math.min(2, window.devicePixelRatio || 1);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

/* ---------- Shape, theme and motion controls ---------- */

function currentShape(): ShapeName {
	const name = html.dataset.shape;
	return isShape(name) ? name : DEFAULT_SHAPE;
}

function syncShapeControls(): void {
	const name = currentShape();
	for (const label of document.querySelectorAll<HTMLElement>("[data-shape-label]")) {
		label.textContent = name;
	}
}

function setShape(name: ShapeName | "next"): ShapeName {
	const next = name === "next" ? nextShape(currentShape()) : name;
	html.dataset.shape = next;
	store.set(SHAPE_KEY, next);
	syncShapeControls();
	return next;
}

function setTheme(value: "light" | "dark" | "auto"): void {
	if (value === "auto") delete html.dataset.theme;
	else html.dataset.theme = value;
	store.set(THEME_KEY, value === "auto" ? null : value);
}

function setMotion(value: "on" | "off"): string | null {
	const state = html.dataset.motion;
	if (state === "reduced") return "your system asks for reduced motion, so the site holds still";
	const toggle = document.querySelector<HTMLElement>("[data-motion-toggle]:not([hidden])");
	if (!toggle) return "nothing moves on this page";
	if ((value === "on") !== (state === "on")) toggle.click();
	return null;
}

/* ---------- Dot field and wordmark ---------- */

const CELL = 12;

function initField(section: HTMLElement): void {
	const canvas = section.querySelector<HTMLCanvasElement>(".field-canvas");
	const ctx = canvas?.getContext("2d");
	if (!canvas || !ctx) return;

	const letters = [...section.querySelectorAll<HTMLElement>("[data-wordmark] > span")];
	const axis = section.querySelector<HTMLElement>("[data-axis]");
	const axisName = section.querySelector<HTMLElement>("[data-axis-name]");
	const field = new DotField(CELL);
	const base = document.createElement("canvas");
	const baseCtx = base.getContext("2d");
	const pointer = { x: 0, y: 0, inside: false };
	let centres: { x: number; y: number; w: number }[] = [];
	let dpr = 1;
	let width = 0;
	let height = 0;
	let visible = false;
	let clock = 0;
	let lastAxis = -1;
	let axisAt = 0;

	/** The still grid: drawn once per size or theme change, then copied every frame. */
	const paintBase = () => {
		if (!baseCtx) return;
		base.width = canvas.width;
		base.height = canvas.height;
		baseCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
		baseCtx.clearRect(0, 0, width, height);
		baseCtx.fillStyle = colors.dot;
		for (let row = 0; row < field.rows; row++) {
			for (let col = 0; col < field.cols; col++) {
				baseCtx.fillRect(col * CELL + CELL / 2 - 1, row * CELL + CELL / 2 - 1, 2, 2);
			}
		}
	};

	const draw = () => {
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(base, 0, 0);
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.fillStyle = colors.hot;
		const { cols } = field;
		for (let i = 0; i < field.heat.length; i++) {
			const h = field.level(i);
			if (h === 0) continue;
			// Size follows heat on a curve, so trails thin out fast and the hottest cells read.
			const size = 2 + Math.pow(h, 1.6) * (CELL - 3);
			const cx = (i % cols) * CELL + CELL / 2;
			const cy = Math.floor(i / cols) * CELL + CELL / 2;
			ctx.globalAlpha = Math.min(1, 0.25 + h);
			ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
		}
		ctx.globalAlpha = 1;
	};

	const measure = () => {
		const box = section.getBoundingClientRect();
		dpr = dprOf();
		width = box.width;
		height = box.height;
		canvas.width = Math.round(width * dpr);
		canvas.height = Math.round(height * dpr);
		field.resize(width, height);
		centres = letters.map((el) => {
			const r = el.getBoundingClientRect();
			return { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2, w: r.width };
		});
		paintBase();
		draw();
		if (visible && motionOn()) wake(frame);
	};

	const showAxis = (value: number) => {
		const rounded = Math.round(wrapElsh(value));
		if (rounded === lastAxis) return;
		lastAxis = rounded;
		if (axis) axis.textContent = `ELSH ${String(rounded).padStart(3, "0")}`;
		if (axisName) axisName.textContent = nearestShape(rounded);
	};

	const resetLetters = () => {
		for (const el of letters) el.style.removeProperty("--elsh");
		lastAxis = -1;
		showAxis(globalElsh());
	};

	// CSSOM writes are allowed by the CSP (only style="" attributes in markup are blocked).
	const setLetter = (node: HTMLElement, value: number) =>
		node.style.setProperty("--elsh", value.toFixed(1));

	const shapeLetters = () => {
		const g = globalElsh();
		let focus = g;
		let nearest = Infinity;
		for (let i = 0; i < letters.length; i++) {
			const c = centres[i];
			if (!c) continue;
			// Develop on first view: each letter runs through the shapes before it settles.
			const intro = 1 - easeOut(clamp01((clock - 0.1 - i * 0.12) / 1.2));
			let v = g + 79 * intro + 4 * Math.sin(clock * 1.25 + i * 0.85);
			if (pointer.inside) {
				const d = Math.hypot(pointer.x - c.x, pointer.y - c.y);
				const k = clamp01(1 - d / (c.w * 1.6));
				v += 58 * k * k * (3 - 2 * k);
				if (d < nearest) {
					nearest = d;
					focus = v;
				}
			}
			for (const p of field.pulses) v += 40 * DotField.ringStrength(p, c.x, c.y, 140);
			setLetter(letters[i], wrapElsh(v));
		}
		if (clock - axisAt > 0.08) {
			axisAt = clock;
			showAxis(pointer.inside ? focus : g);
		}
	};

	const frame: Task = (dt) => {
		if (!motionOn()) {
			field.resize(width, height);
			draw();
			resetLetters();
			return false;
		}
		if (!visible) return false;
		clock += dt;
		if (pointer.inside) field.stamp(pointer.x, pointer.y, 54, 0.9);
		if (Math.random() < dt * 9) field.sparkle();
		field.step(dt);
		draw();
		shapeLetters();
		return true;
	};

	const local = (event: PointerEvent) => {
		const box = section.getBoundingClientRect();
		return { x: event.clientX - box.left, y: event.clientY - box.top };
	};

	section.addEventListener("pointermove", (event) => {
		const p = local(event);
		// Fill in the path between events so a fast flick leaves a continuous trail.
		if (pointer.inside && motionOn()) {
			const steps = Math.min(24, Math.floor(Math.hypot(p.x - pointer.x, p.y - pointer.y) / CELL));
			for (let s = 1; s < steps; s++) {
				const t = s / steps;
				field.stamp(pointer.x + (p.x - pointer.x) * t, pointer.y + (p.y - pointer.y) * t, 40, 0.7);
			}
		}
		pointer.x = p.x;
		pointer.y = p.y;
		pointer.inside = true;
		if (visible && motionOn()) wake(frame);
	});
	const leave = () => {
		pointer.inside = false;
	};
	section.addEventListener("pointerleave", leave);
	section.addEventListener("pointercancel", leave);
	section.addEventListener("pointerdown", (event) => {
		if (!motionOn() || (event.target as Element).closest("a, button")) return;
		const p = local(event);
		field.pulse(p.x, p.y);
		wake(frame);
	});

	new ResizeObserver(measure).observe(section);
	document.fonts?.ready.then(measure).catch(() => {});
	new IntersectionObserver((records) => {
		visible = records.some((r) => r.isIntersecting);
		if (visible && motionOn()) wake(frame);
	}).observe(section);

	repaints.add(() => {
		paintBase();
		draw();
	});
	motionListeners.add(() => {
		if (motionOn()) wake(frame);
		else {
			field.resize(width, height);
			draw();
			resetLetters();
		}
	});
	resetLetters();
}

/* ---------- Pixel fill on rows and tiles ---------- */

const fills = new Set<{ reset(): void }>();

function initFill(host: HTMLElement): void {
	const fill = new PixelFill();
	let canvas: HTMLCanvasElement | null = null;
	let ctx: CanvasRenderingContext2D | null = null;
	let dpr = 1;
	let width = 0;
	let height = 0;
	let hovered = false;
	let focused = false;

	const setLit = (on: boolean) => {
		if (on) host.dataset.lit = "";
		else delete host.dataset.lit;
	};

	const draw = () => {
		if (!ctx || !canvas) return;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, width, height);
		ctx.fillStyle = colors.fill;
		const { cell } = fill.opts;
		for (let row = 0; row < fill.rows; row++) {
			for (let col = 0; col < fill.cols; col++) {
				const v = fill.value[row * fill.cols + col];
				if (v <= 0) continue;
				// Full cells overlap by half a pixel so no seams show between them.
				const size = v >= 1 ? cell + 0.5 : cell * v;
				const inset = v >= 1 ? 0 : (cell - size) / 2;
				ctx.fillRect(col * cell + inset, row * cell + inset, size, size);
			}
		}
	};

	const size = () => {
		if (!canvas) return;
		const box = host.getBoundingClientRect();
		dpr = dprOf();
		width = box.width;
		height = box.height;
		canvas.width = Math.round(width * dpr);
		canvas.height = Math.round(height * dpr);
		fill.resize(width, height);
		draw();
	};

	const ensureCanvas = () => {
		if (canvas) return;
		canvas = document.createElement("canvas");
		canvas.className = "fill-canvas";
		canvas.setAttribute("aria-hidden", "true");
		host.prepend(canvas);
		ctx = canvas.getContext("2d");
		new ResizeObserver(size).observe(host);
		size();
	};

	const frame: Task = (dt) => {
		const moving = fill.step(dt);
		draw();
		const coverage = fill.coverage();
		setLit(fill.target === 1 ? coverage >= 0.4 : coverage > 0.6);
		return moving;
	};

	const go = (target: 0 | 1, x: number, y: number) => {
		if (!motionOn()) return;
		ensureCanvas();
		fill.set(target, x, y);
		wake(frame);
	};

	const local = (event: PointerEvent): [number, number] => {
		const box = host.getBoundingClientRect();
		return [event.clientX - box.left, event.clientY - box.top];
	};

	host.addEventListener("pointerenter", (event) => {
		hovered = true;
		go(1, ...local(event));
	});
	host.addEventListener("pointerleave", (event) => {
		hovered = false;
		if (!focused) go(0, ...local(event));
	});
	// Keyboard focus only: a mouse click also focuses the link, and must not pin the fill on.
	host.addEventListener("focusin", (event) => {
		if (!(event.target as Element).matches(":focus-visible")) return;
		focused = true;
		go(1, 0, height / 2);
	});
	host.addEventListener("focusout", (event) => {
		if (host.contains(event.relatedTarget as Node | null)) return;
		focused = false;
		if (!hovered) go(0, width, height / 2);
	});

	const reset = () => {
		hovered = false;
		focused = false;
		fill.snap(0);
		draw();
		setLit(false);
	};
	fills.add({ reset });
	repaints.add(draw);
}

/* ---------- Live clocks ---------- */

function initClocks(): void {
	const clocks = [...document.querySelectorAll<HTMLElement>("[data-clock]")].flatMap((el) => {
		try {
			const format = new Intl.DateTimeFormat("en-AU", {
				timeZone: el.dataset.tz,
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit",
				hourCycle: "h23",
				timeZoneName: "short",
			});
			return [{ el, format }];
		} catch {
			return [];
		}
	});
	if (clocks.length === 0) return;
	const tick = () => {
		const now = new Date();
		for (const { el, format } of clocks) {
			el.textContent = format.format(now);
			el.setAttribute("datetime", now.toISOString());
		}
	};
	tick();
	window.setInterval(tick, 1000);
	for (const { el } of clocks) el.closest<HTMLElement>("[hidden]")?.removeAttribute("hidden");
}

/* ---------- Boot ---------- */

function syncMotion(): void {
	if (motionOn()) html.dataset.fillLive = "";
	else {
		delete html.dataset.fillLive;
		for (const f of fills) f.reset();
	}
	for (const listener of motionListeners) listener();
}

/** Wire the Geist Pixel layer. Safe to call once per page. */
export function initPixel(): void {
	readColors();

	for (const button of document.querySelectorAll<HTMLElement>("[data-shape-toggle]")) {
		button.hidden = false;
		button.addEventListener("click", () => setShape("next"));
	}
	syncShapeControls();

	for (const section of document.querySelectorAll<HTMLElement>("[data-field]")) initField(section);
	for (const host of document.querySelectorAll<HTMLElement>("[data-fill]")) initFill(host);
	initClocks();
	initShell({ setShape, setTheme, setMotion });

	// Theme changes (OS setting, or the shell's theme command) recolour the canvases.
	new MutationObserver((records) => {
		if (records.some((r) => r.attributeName === "data-theme")) readColors();
		if (records.some((r) => r.attributeName === "data-motion")) syncMotion();
	}).observe(html, { attributes: true, attributeFilter: ["data-theme", "data-motion"] });
	window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", readColors);

	// Coming back through the back/forward cache: drop any fill left on from the click away.
	window.addEventListener("pageshow", (event) => {
		if (event.persisted) for (const f of fills) f.reset();
	});

	syncMotion();
	html.dataset.pixelReady = "";
}
