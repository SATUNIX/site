// DOM layer for the site shell (logic lives in ./shell.ts).
//
// Markup contract (PixelShell.astro):
//   <dialog data-shell> ... [data-shell-out] ... <form data-shell-form><input data-shell-input>
//   plus an inline script that assigns the page's ShellData to window[SHELL_GLOBAL].
// The data arrives as code built with the page, never read back out of DOM text, so the hrefs
// it holds cannot be swapped by anything that edits the page's markup.
// Buttons with [data-shell-open] open it; so does "/" (or Ctrl/Cmd+K) outside a text field.
// Output is built with textContent and real anchors only; nothing is parsed as HTML.

import type { ShapeName } from "./shapes";
import {
	commonPrefix,
	complete,
	execute,
	SHELL_GLOBAL,
	type Action,
	type Line,
	type ShellData,
} from "./shell";

export interface ShellHooks {
	setShape(name: ShapeName | "next"): ShapeName;
	setTheme(value: "light" | "dark" | "auto"): void;
	/** Returns a message when the request cannot be honoured on this page. */
	setMotion(value: "on" | "off"): string | null;
}

const HISTORY_KEY = "shell-history";
const HISTORY_MAX = 50;

function loadHistory(): string[] {
	try {
		const raw = sessionStorage.getItem(HISTORY_KEY);
		const parsed: unknown = raw ? JSON.parse(raw) : [];
		return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
	} catch {
		return [];
	}
}

function saveHistory(history: string[]): void {
	try {
		sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-HISTORY_MAX)));
	} catch {
		// Storage unavailable: history lasts for this page only.
	}
}

function isEditable(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	return target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
}

export function initShell(hooks: ShellHooks): void {
	const dialog = document.querySelector<HTMLDialogElement>("dialog[data-shell]");
	const out = dialog?.querySelector<HTMLElement>("[data-shell-out]");
	const form = dialog?.querySelector<HTMLFormElement>("[data-shell-form]");
	const input = dialog?.querySelector<HTMLInputElement>("[data-shell-input]");
	const data = (window as unknown as Record<string, ShellData | undefined>)[SHELL_GLOBAL];
	if (!dialog || !out || !form || !input || !data || typeof dialog.showModal !== "function") return;

	const history = loadHistory();
	let cursor = history.length;
	let greeted = false;

	const print = (lines: Line[]) => {
		for (const line of lines) {
			const row = document.createElement("div");
			row.className = line.tone ? `shell__line shell__line--${line.tone}` : "shell__line";
			if (line.href) {
				const a = document.createElement("a");
				a.href = line.href;
				a.textContent = line.text;
				row.append(a);
			} else {
				row.textContent = line.text;
			}
			out.append(row);
		}
		out.scrollTop = out.scrollHeight;
	};

	const act = (action: Action | undefined) => {
		if (!action) return;
		switch (action.kind) {
			case "navigate":
				// A beat so the echoed line is seen before the page changes.
				window.setTimeout(() => window.location.assign(action.href), 120);
				break;
			case "shape": {
				const name = hooks.setShape(action.name);
				if (action.name === "next") print([{ text: `shape: ${name}`, tone: "dim" }]);
				break;
			}
			case "theme":
				hooks.setTheme(action.value);
				break;
			case "motion": {
				const note = hooks.setMotion(action.value);
				if (note) print([{ text: note, tone: "dim" }]);
				break;
			}
			case "clear":
				out.replaceChildren();
				break;
			case "close":
				dialog.close();
				break;
		}
	};

	const run = (line: string) => {
		const trimmed = line.trim();
		print([{ text: `$ ${trimmed}`, tone: "hi" }]);
		if (trimmed && history[history.length - 1] !== trimmed) {
			history.push(trimmed);
			saveHistory(history);
		}
		cursor = history.length;
		const result = execute(trimmed, data);
		print(result.lines);
		act(result.action);
	};

	const open = () => {
		if (!dialog.open) dialog.showModal();
		if (!greeted) {
			greeted = true;
			print([
				{ text: `${data.whoami[0] ?? "site"}: type help, or ls to look around.`, tone: "dim" },
				{ text: "Tab completes, Up and Down recall, Esc closes.", tone: "dim" },
			]);
		}
		input.focus();
	};

	form.addEventListener("submit", (event) => {
		event.preventDefault();
		run(input.value);
		input.value = "";
	});

	input.addEventListener("keydown", (event) => {
		if (event.key === "ArrowUp" && cursor > 0) {
			cursor -= 1;
			input.value = history[cursor];
			event.preventDefault();
		} else if (event.key === "ArrowDown") {
			cursor = Math.min(history.length, cursor + 1);
			input.value = history[cursor] ?? "";
			event.preventDefault();
		} else if (event.key === "Tab" && input.value.trim()) {
			event.preventDefault();
			const candidates = complete(input.value, data);
			if (candidates.length === 1) {
				input.value = candidates[0].endsWith("/") ? candidates[0] : `${candidates[0]} `;
			} else if (candidates.length > 1) {
				input.value = commonPrefix(candidates);
				print([{ text: candidates.map((c) => c.split(" ").pop()).join("  "), tone: "dim" }]);
			}
		} else if (event.key === "l" && event.ctrlKey) {
			event.preventDefault();
			out.replaceChildren();
		}
	});

	// Light dismiss: a click on the backdrop lands on the dialog element itself.
	dialog.addEventListener("click", (event) => {
		if (event.target === dialog) dialog.close();
	});

	for (const button of document.querySelectorAll<HTMLElement>("[data-shell-open]")) {
		button.hidden = false;
		button.addEventListener("click", open);
	}
	for (const button of dialog.querySelectorAll<HTMLElement>("[data-shell-close]")) {
		button.addEventListener("click", () => dialog.close());
	}

	document.addEventListener("keydown", (event) => {
		if (event.defaultPrevented || dialog.open || isEditable(event.target)) return;
		const slash = event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey;
		const palette = event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey);
		if (slash || palette) {
			event.preventDefault();
			open();
		}
	});
}
