// Homepage profile content, kept apart from presentation. Fill these in; `null` values render
// as an explicit "unset" state instead of invented details. Plain ASCII text only.

export interface Fact {
	/** Short lowercase key, shown like a system readout: "role", "based", ... */
	key: string;
	value: string | null;
}

export interface Profile {
	/** Intro paragraphs for the homepage. Empty until written. */
	intro: string[];
	/** Key info shown as a compact readout next to the intro. */
	facts: Fact[];
}

export const profile: Profile = {
	intro: [],
	facts: [
		{ key: "role", value: null },
		{ key: "based", value: null },
		{ key: "focus", value: null },
		{ key: "stack", value: null },
		{ key: "status", value: null },
	],
};
