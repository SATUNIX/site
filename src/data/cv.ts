// CV content, kept apart from presentation. Plain ASCII text only.
// Employer names are deliberately omitted: roles are listed by title and period.

export interface Role {
	title: string;
	/** Employer. Optional: omitted on this CV by choice. */
	org?: string;
	/** Free text, e.g. "2025 H2 - present". */
	period: string;
	/** Short bullet points. Optional. */
	points: string[];
}

export interface Qualification {
	name: string;
	/** e.g. "2025", "in progress", "planned". */
	status: string;
}

export interface Cv {
	/** Two or three sentences. */
	summary: string | null;
	/** One line shown under the summary, e.g. availability. */
	note?: string;
	experience: Role[];
	/** What the work has covered, independent of any one role or client. */
	capabilities: string[];
	qualifications: Qualification[];
	/** Short skill groups, e.g. { label: "Languages", items: ["TypeScript", "Go"] }. */
	skills: { label: string; items: string[] }[];
}

export const cv: Cv = {
	summary:
		"Offensive security professional working in security since 2021, across penetration testing, adversary simulation and security engineering. I build the infrastructure, tooling and telemetry that support offensive work, and increasingly focus on the security of AI and autonomous agent systems.",
	note: "Not currently open to new roles.",
	experience: [
		{ title: "Senior Consultant, Offensive Security", period: "2026 H2 - present", points: [] },
		{ title: "Consultant, Offensive Security", period: "2025 H2 - 2026 H1", points: [] },
		{ title: "Consultant, Tech Risk and Cyber", period: "2025 H1", points: [] },
		{ title: "Graduate, IT Audit", period: "2024", points: [] },
	],
	capabilities: [
		"Internal and external network penetration testing",
		"AWS and Azure security testing; cloud IAM and trust-path analysis",
		"Web application and API security assessments",
		"Active Directory, Kerberos and AD CS testing",
		"Phishing and social-engineering simulation",
		"External attack-surface analysis and OSINT",
		"Adversary simulation; offensive infrastructure and C2 engineering",
		"Custom security tooling and automation; CI/CD and GitOps",
		"Detection and telemetry engineering",
		"Security architecture and threat modelling",
		"AI and agentic-system security testing",
		"Technical reporting and remediation guidance",
	],
	qualifications: [
		{ name: "eJPT (INE Security)", status: "2025" },
		{ name: "AZ-500 (Microsoft)", status: "in progress" },
		{ name: "CS50 (Harvard)", status: "in progress" },
		{ name: "CPTS (Hack The Box)", status: "in progress" },
		{ name: "OSCP (OffSec)", status: "in progress" },
	],
	skills: [
		{
			label: "Security",
			items: [
				"Burp Suite",
				"Active Directory",
				"Kerberos",
				"AD CS",
				"web and API testing",
				"phishing",
				"OSINT",
				"adversary simulation",
				"cloud attack paths",
				"IAM",
				"C2 infrastructure",
			],
		},
		{
			label: "Cloud / infra",
			items: [
				"AWS (EC2, IAM, STS, S3, EBS/EFS)",
				"Azure",
				"containers",
				"Kubernetes",
				"GitOps",
				"CI/CD",
				"Linux",
			],
		},
		{
			label: "Engineering",
			items: [
				"Python",
				"Go",
				"C (C99)",
				"Bash",
				"PowerShell",
				"Git",
				"GitHub Actions",
				"APIs",
				"telemetry pipelines",
			],
		},
		{
			label: "AI / LLM",
			items: [
				"local LLM infrastructure (Ollama, llama.cpp, vLLM)",
				"model serving",
				"tool-using agents",
				"MCP-style tooling",
				"agent orchestration",
				"RAG and vector stores",
				"AI security evaluation",
			],
		},
	],
};
