// Homepage profile content, kept apart from presentation. Plain ASCII text only.

export interface Fact {
	/** Short lowercase key, shown like a system readout: "role", "based", ... */
	key: string;
	value: string | null;
}

export interface Area {
	name: string;
	text: string;
	/** Site-relative page this area points to. */
	page: string;
}

export interface Profile {
	/** Intro paragraphs for the homepage. */
	intro: string[];
	/** The three-part scope shown on the homepage. */
	areas: Area[];
	/** Key info shown as a compact readout next to the intro. */
	facts: Fact[];
}

export const profile: Profile = {
	intro: [
		"Offensive security and security engineering. I work across penetration testing, adversary simulation, cloud infrastructure and autonomous AI systems.",
		"Most of my time sits on the boundary between offensive operations and engineering: testing systems, and building the infrastructure, tooling and telemetry that the testing depends on. Increasingly that means the security of AI agents themselves: what they are allowed to do, and how you stop them doing the rest.",
	],
	areas: [
		{
			name: "Offensive Security",
			text: "Penetration testing and adversary simulation across networks, Active Directory, cloud and APIs.",
			page: "work/",
		},
		{
			name: "Security Engineering",
			text: "The infrastructure behind the testing: C2, telemetry pipelines, GitOps, tooling and platforms.",
			page: "work/",
		},
		{
			name: "AI Systems",
			text: "Securing autonomous agents, and building constrained agent systems in a private lab.",
			page: "projects/",
		},
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
