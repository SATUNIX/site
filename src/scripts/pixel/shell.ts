// The site shell: a small command language for getting around the site from the keyboard.
//
// Pure: `execute()` turns one input line into printable lines plus at most one action for the DOM
// layer to carry out (navigate, change the pixel shape, theme or motion, clear, close). It never
// touches the page, so every command is unit-tested.

import { isShape, SHAPE_NAMES, type ShapeName } from "./shapes";

export interface ShellPost {
	slug: string;
	title: string;
	date: string;
	href: string;
}

export interface ShellDir {
	/** Name as typed and listed, with a trailing slash ("work/"), or a file name ("cv.txt"). */
	name: string;
	/** Other names that resolve to it ("projects", "blog"). */
	aliases: string[];
	href: string;
	note: string;
}

export interface ShellData {
	/** Href of the home page. */
	home: string;
	/** Site path of the current page, for `pwd` ("/", "/work/"). */
	here: string;
	dirs: ShellDir[];
	posts: ShellPost[];
	/** Engagement types for `ls work/`. */
	work: string[];
	/** Projects for `ls lab/`. */
	lab: { title: string; status: string }[];
	/** External profiles for `ls links/`. */
	links: { key: string; href: string }[];
	/** Lines printed by `whoami`. */
	whoami: string[];
}

/**
 * Global the page's shell data is assigned to, by an inline script PixelShell.astro renders
 * (hashed into the CSP). It is build-time data, so it ships as code rather than as DOM text.
 */
export const SHELL_GLOBAL = "__siteShell";

export type Action =
	| { kind: "navigate"; href: string }
	| { kind: "shape"; name: ShapeName | "next" }
	| { kind: "theme"; value: "light" | "dark" | "auto" }
	| { kind: "motion"; value: "on" | "off" }
	| { kind: "clear" }
	| { kind: "close" };

export interface Line {
	text: string;
	tone?: "dim" | "hi" | "err";
	href?: string;
}

export interface Result {
	lines: Line[];
	action?: Action;
}

const COMMANDS: { name: string; args?: string; help: string }[] = [
	{ name: "ls", args: "[dir]", help: "list the site, or a directory" },
	{ name: "cd", args: "<dir>", help: "go to a page (cd ~ for home)" },
	{ name: "open", args: "<n|slug>", help: "open a post from ls writing/" },
	{ name: "cat", args: "cv.txt", help: "open the CV" },
	{ name: "whoami", help: "who this is" },
	{ name: "pwd", help: "where you are" },
	{ name: "shape", args: "[name]", help: SHAPE_NAMES.join(" | ") + " | next" },
	{ name: "theme", args: "<mode>", help: "light | dark | auto" },
	{ name: "motion", args: "<on|off>", help: "animate the site, or hold it still" },
	{ name: "clear", help: "clear the screen" },
	{ name: "exit", help: "close the shell" },
];

const pad = (n: number) => String(n).padStart(2, "0");

const err = (text: string): Result => ({ lines: [{ text, tone: "err" }] });

/**
 * A typed path reduced to a bare name: "./work/", "~/work" and "/work//" all become "work".
 * Plain loops rather than regexes, because this runs on whatever is typed or pasted into the
 * shell and a trailing-run pattern like /\/+$/ takes quadratic time on a long run of slashes.
 */
export function dirKey(arg: string): string {
	let start = arg.startsWith("./") || arg.startsWith("~/") ? 2 : 0;
	let end = arg.length;
	while (start < end && arg[start] === "/") start++;
	while (end > start && arg[end - 1] === "/") end--;
	return arg.slice(start, end).toLowerCase();
}

/** Resolve a typed directory or file name to its entry. */
export function resolveDir(arg: string, data: ShellData): ShellDir | undefined {
	const key = dirKey(arg);
	return data.dirs.find(
		(d) => d.name.replace(/\/$/, "") === key || d.aliases.includes(key),
	);
}

/** Find a post by its 1-based number in `ls writing/`, or by slug. */
export function resolvePost(arg: string, data: ShellData): ShellPost | undefined {
	if (/^\d+$/.test(arg)) return data.posts[Number(arg) - 1];
	const slug = arg.replace(/^writing\//, "").replace(/\/$/, "").toLowerCase();
	return data.posts.find((p) => p.slug === slug);
}

function list(arg: string | undefined, data: ShellData): Result {
	if (!arg || arg === "." || arg === "~" || arg === "/") {
		return {
			lines: data.dirs.map((d) => ({ text: `${d.name.padEnd(10)} ${d.note}`, href: d.href })),
		};
	}
	const dir = resolveDir(arg, data);
	if (!dir) return err(`ls: ${arg}: no such directory`);
	switch (dir.name) {
		case "work/":
			return { lines: data.work.map((title) => ({ text: title })) };
		case "lab/":
			return {
				lines: data.lab.map((p) => ({ text: `${p.status.padEnd(11)} ${p.title}` })),
			};
		case "writing/":
			if (data.posts.length === 0) return { lines: [{ text: "no posts yet", tone: "dim" }] };
			return {
				lines: [
					...data.posts.map((p, i) => ({
						text: `[${pad(i + 1)}] ${p.date}  ${p.title}`,
						href: p.href,
					})),
					{ text: "open <n> to read one", tone: "dim" },
				],
			};
		case "links/":
			return {
				lines: data.links.map((l) => ({
					text: `${l.key.padEnd(10)} ${l.href.replace(/^https?:\/\//, "")}`,
					href: l.href,
				})),
			};
		default:
			return { lines: [{ text: dir.name, href: dir.href }] };
	}
}

/** Run one line of input. */
export function execute(input: string, data: ShellData): Result {
	const words = input.trim().split(/\s+/).filter(Boolean);
	if (words.length === 0) return { lines: [] };
	const [cmd, ...args] = words;
	const arg = args[0];

	switch (cmd.toLowerCase()) {
		case "help":
		case "?":
			return {
				lines: COMMANDS.map((c) => ({
					text: `${`${c.name} ${c.args ?? ""}`.padEnd(16)} ${c.help}`,
				})),
			};
		case "ls":
		case "dir":
			return list(arg, data);
		case "cd": {
			if (!arg || arg === "~" || arg === "/" || arg === ".." || arg === "~/") {
				return { lines: [{ text: "cd ~", tone: "dim" }], action: { kind: "navigate", href: data.home } };
			}
			const dir = resolveDir(arg, data);
			if (!dir) return err(`cd: ${arg}: no such directory`);
			if (!dir.name.endsWith("/")) return err(`cd: ${arg}: not a directory (try cat ${dir.name})`);
			return {
				lines: [{ text: `opening ${dir.name}`, tone: "dim" }],
				action: { kind: "navigate", href: dir.href },
			};
		}
		case "open":
		case "less":
		case "more": {
			if (!arg) return err(`${cmd}: which post? run ls writing/ for numbers`);
			const post = resolvePost(arg, data);
			if (post) {
				return {
					lines: [{ text: `opening ${post.title}`, tone: "dim" }],
					action: { kind: "navigate", href: post.href },
				};
			}
			const dir = resolveDir(arg, data);
			if (dir) {
				return {
					lines: [{ text: `opening ${dir.name}`, tone: "dim" }],
					action: { kind: "navigate", href: dir.href },
				};
			}
			return err(`${cmd}: ${arg}: no such post`);
		}
		case "cat": {
			if (!arg) return err("cat: which file? try cat cv.txt");
			const dir = resolveDir(arg, data);
			if (dir && !dir.name.endsWith("/")) {
				return {
					lines: [{ text: `opening ${dir.name}`, tone: "dim" }],
					action: { kind: "navigate", href: dir.href },
				};
			}
			if (dir) return err(`cat: ${arg}: is a directory (try ls ${dir.name})`);
			return err(`cat: ${arg}: no such file`);
		}
		case "whoami":
			return { lines: data.whoami.map((text) => ({ text })) };
		case "pwd":
			return { lines: [{ text: `~${data.here}` }] };
		case "shape": {
			const name = (arg ?? "next").toLowerCase();
			if (name !== "next" && !isShape(name)) {
				return err(`shape: ${arg}: pick one of ${SHAPE_NAMES.join(", ")} or next`);
			}
			return {
				lines: [{ text: name === "next" ? "next shape" : `shape: ${name}`, tone: "dim" }],
				action: { kind: "shape", name: name as ShapeName | "next" },
			};
		}
		case "theme": {
			const value = arg?.toLowerCase();
			if (value !== "light" && value !== "dark" && value !== "auto") {
				return err("theme: use light, dark or auto (follow the system)");
			}
			return { lines: [{ text: `theme: ${value}`, tone: "dim" }], action: { kind: "theme", value } };
		}
		case "motion": {
			const value = arg?.toLowerCase();
			if (value !== "on" && value !== "off") return err("motion: use on or off");
			return { lines: [{ text: `motion: ${value}`, tone: "dim" }], action: { kind: "motion", value } };
		}
		case "clear":
		case "cls":
			return { lines: [], action: { kind: "clear" } };
		case "exit":
		case "quit":
		case "q":
			return { lines: [], action: { kind: "close" } };
		case "echo":
			return { lines: [{ text: args.join(" ") }] };
		case "sudo":
			return err("sudo: you are not in the sudoers file. This incident will be reported.");
		case "rm":
			return err("rm: read-only file system");
		default:
			return err(`${cmd}: command not found. Type help`);
	}
}

/** Full-line completions for `input`, in a stable order. */
export function complete(input: string, data: ShellData): string[] {
	const lead = input.replace(/^\s+/, "");
	const space = lead.indexOf(" ");
	if (space === -1) {
		return COMMANDS.map((c) => c.name).filter((name) => name.startsWith(lead.toLowerCase()));
	}
	const cmd = lead.slice(0, space).toLowerCase();
	const partial = lead.slice(space + 1).trimStart().toLowerCase();
	const options: Record<string, string[]> = {
		ls: data.dirs.filter((d) => d.name.endsWith("/")).map((d) => d.name),
		cd: data.dirs.filter((d) => d.name.endsWith("/")).map((d) => d.name),
		cat: data.dirs.filter((d) => !d.name.endsWith("/")).map((d) => d.name),
		open: data.posts.map((p) => p.slug),
		shape: [...SHAPE_NAMES, "next"],
		theme: ["light", "dark", "auto"],
		motion: ["on", "off"],
	};
	return (options[cmd] ?? [])
		.filter((option) => option.startsWith(partial))
		.map((option) => `${cmd} ${option}`);
}

/** The longest prefix every candidate shares, for Tab completion. */
export function commonPrefix(candidates: string[]): string {
	if (candidates.length === 0) return "";
	let prefix = candidates[0];
	for (const c of candidates.slice(1)) {
		while (!c.startsWith(prefix)) prefix = prefix.slice(0, -1);
	}
	return prefix;
}
