// Homepage profile content, kept apart from presentation. Plain ASCII text only.

export interface Fact {
	/** Short lowercase key, shown like a system readout: "role", "based", ... */
	key: string;
	value: string | null;
}

export interface Profile {
	/** Intro paragraphs for the homepage. */
	intro: string[];
	/** Key info shown as a compact readout next to the intro. */
	facts: Fact[];
}

export const profile: Profile = {
	intro: [
		"Offensive security and security engineering. I work across penetration testing, adversary simulation, cloud infrastructure and autonomous AI systems.",
		"Most of my time sits on the boundary between offensive operations and engineering: testing systems, and building the infrastructure, tooling and telemetry that the testing depends on. Increasingly that means the security of AI agents themselves: what they are allowed to do, and how you stop them doing the rest.",
	],
	facts: [
		{ key: "role", value: "senior consultant, offensive security" },
		{ key: "based", value: "Brisbane, AU" },
		{ key: "focus", value: "adversary simulation, cloud, AI agents" },
		{ key: "stack", value: "Python, Go, C, AWS, Azure, Linux" },
		{ key: "lab", value: "private GitLab + AWS" },
		{ key: "status", value: "not open to work" },
	],
};
