// DOM runtime for the ASCII effects.
//
// Markup contract:
//   <pre data-ascii="hero-etch" aria-hidden="true">...final text...</pre>
//   Optional `data-ascii-pointer` enables the pointer ripple on that element.
// The element's text in the HTML is the final state, so no-JS and reduced-motion visitors see
// finished text. Accessible text lives elsewhere (a visually-hidden sibling or the real heading).
//
// `<html data-motion>` is set by an inline head script: "on", "paused" (visitor choice) or
// "reduced" (OS preference). Only "on" animates.

import { Animator } from "./animator";
import { isPreset, PRESETS, RIPPLE, type PresetName } from "./presets";

interface Entry {
	el: HTMLElement;
	text: string;
	animator: Animator;
	/** performance.now() of the first painted frame; NaN until then (e.g. in a background tab). */
	startedAt: number;
	lastDraw: number;
}

const MOTION_KEY = "motion";
const entries = new Map<HTMLElement, Entry>();
const running = new Set<Entry>();
let rafId = 0;

const html = document.documentElement;
const motionOn = () => html.dataset.motion === "on";

/** Seconds since the entry started. */
const clock = (entry: Entry, now: number) => (now - entry.startedAt) / 1000;

function tick(now: number): void {
	rafId = 0;
	for (const entry of running) {
		if (now - entry.lastDraw < 1000 / entry.animator.fps - 1) continue;
		entry.lastDraw = now;
		// Start the clock on the first frame the visitor can actually see.
		if (Number.isNaN(entry.startedAt)) entry.startedAt = now;
		const t = clock(entry, now);
		if (entry.animator.done(t)) {
			entry.el.textContent = entry.text;
			running.delete(entry);
		} else {
			entry.el.textContent = entry.animator.frame(t);
		}
	}
	if (running.size > 0) rafId = requestAnimationFrame(tick);
}

function wake(entry: Entry): void {
	running.add(entry);
	if (!rafId) rafId = requestAnimationFrame(tick);
}

function finishAll(): void {
	for (const entry of running) entry.el.textContent = entry.text;
	running.clear();
	if (rafId) cancelAnimationFrame(rafId);
	rafId = 0;
}

/** Start (or restart) an element's animation, optionally switching preset. */
export function play(el: HTMLElement, preset?: PresetName): void {
	const name = preset ?? el.dataset.ascii;
	el.dataset.inview = "true";
	const previous = entries.get(el);
	const text = previous?.text ?? el.textContent ?? "";
	if (!motionOn() || !isPreset(name)) {
		el.textContent = text;
		return;
	}
	if (preset) el.dataset.ascii = preset;
	if (previous) running.delete(previous);
	const entry: Entry = {
		el,
		text,
		animator: new Animator(text, PRESETS[name]),
		startedAt: Number.NaN,
		lastDraw: -Infinity,
	};
	entries.set(el, entry);
	el.textContent = entry.animator.frame(0);
	wake(entry);
}

/** Map a client-space point to character indices within `radius` px, biased to the centre. */
function cellsNear(entry: Entry, x: number, y: number, radius: number, count: number): number[] {
	const lines = entry.text.split("\n");
	const cols = Math.max(...lines.map((l) => l.length));
	const rect = entry.el.getBoundingClientRect();
	const cellW = rect.width / cols;
	const cellH = rect.height / lines.length;
	const starts: number[] = [];
	lines.reduce((offset, line) => (starts.push(offset), offset + line.length + 1), 0);

	const picked: number[] = [];
	for (let n = 0; n < count; n++) {
		const dist = Math.pow(Math.random(), 2) * radius;
		const angle = Math.random() * Math.PI * 2;
		const col = Math.floor((x + Math.cos(angle) * dist - rect.left) / cellW);
		const row = Math.floor((y + Math.sin(angle) * dist - rect.top) / cellH);
		if (row < 0 || row >= lines.length || col < 0 || col >= lines[row].length) continue;
		picked.push(starts[row] + col);
	}
	return picked;
}

function attachPointer(el: HTMLElement): void {
	let lastX = 0;
	let lastY = 0;
	const ripple = (x: number, y: number, radius: number, count: number) => {
		const entry = entries.get(el);
		if (!entry || !motionOn()) return;
		if (Number.isNaN(entry.startedAt)) return;
		// Keep the animator's clock current so new flicker starts now, not in the past.
		entry.animator.frame(clock(entry, performance.now()));
		entry.animator.perturb(cellsNear(entry, x, y, radius, count), RIPPLE);
		wake(entry);
	};
	el.addEventListener("pointermove", (event) => {
		if (event.pointerType !== "mouse") return;
		const speed = Math.hypot(event.clientX - lastX, event.clientY - lastY);
		lastX = event.clientX;
		lastY = event.clientY;
		const energy = Math.min(1, Math.max(0, (speed - 2) / 38));
		if (energy > 0) ripple(event.clientX, event.clientY, 50 + 100 * energy, 6 + 24 * energy);
	});
	// Touch and pen: a single burst where the finger lands, so mobile gets the effect too.
	el.addEventListener("pointerdown", (event) => {
		if (event.pointerType !== "mouse") ripple(event.clientX, event.clientY, 160, 90);
	});
}

function setMotion(state: "on" | "paused"): void {
	html.dataset.motion = state;
	try {
		localStorage.setItem(MOTION_KEY, state);
	} catch {
		// Storage can be unavailable (private mode); the choice then lasts for this page only.
	}
	if (state === "paused") finishAll();
	for (const button of document.querySelectorAll<HTMLElement>("[data-motion-toggle]")) {
		button.setAttribute("aria-pressed", String(state === "paused"));
		const label = button.querySelector("[data-motion-label]");
		if (label) label.textContent = state === "paused" ? "off" : "on";
	}
}

/** Wire every `[data-ascii]` element under `root`. Safe to call once per page. */
export function initAscii(root: ParentNode = document): void {
	const targets = [...root.querySelectorAll<HTMLElement>("[data-ascii]")];

	for (const button of document.querySelectorAll<HTMLElement>("[data-motion-toggle]")) {
		if (html.dataset.motion === "reduced") {
			button.hidden = true;
			continue;
		}
		const paused = html.dataset.motion === "paused";
		button.setAttribute("aria-pressed", String(paused));
		const label = button.querySelector("[data-motion-label]");
		if (label) label.textContent = paused ? "off" : "on";
		button.addEventListener("click", () =>
			setMotion(html.dataset.motion === "paused" ? "on" : "paused"),
		);
	}

	if (!motionOn() || !("IntersectionObserver" in window)) {
		for (const el of targets) el.dataset.inview = "true";
		html.dataset.asciiReady = "";
		return;
	}

	const observer = new IntersectionObserver(
		(records) => {
			for (const record of records) {
				if (!record.isIntersecting) continue;
				observer.unobserve(record.target);
				play(record.target as HTMLElement);
			}
		},
		{ threshold: 0.2, rootMargin: "0px 0px -8% 0px" },
	);
	for (const el of targets) {
		observer.observe(el);
		if (el.hasAttribute("data-ascii-pointer")) attachPointer(el);
	}
	html.dataset.asciiReady = "";
}
