// Personal research and experiments for the /projects/ page. Plain ASCII text only.
//
// These are personal projects, not client work, and are labelled that way on the page.

export interface Project {
	title: string;
	/** One-line description. */
	tagline: string;
	/** "research", "ongoing", "experiment", ... */
	status: string;
	summary: string;
	themes: string[];
	/** Public link, when one exists. */
	href?: string;
}

export const projectsIntro = [
	"Personal research and experiments, separate from client work. Most of it lives in a private lab (self-hosted GitLab and AWS) and changes constantly.",
	"GitHub holds a small public subset: things that have been pulled out of the lab on purpose, sometimes in rougher shape than the versions still running privately.",
];

export const projects: Project[] = [
	{
		title: "SOAR: dynamic delegation",
		tagline: "Letting agent topology follow the problem.",
		status: "research",
		summary:
			"An agent receives a goal and a plan, decides whether it can finish the work as one unit, and otherwise decomposes it and delegates the parts to specialised workers, recursively. No fixed org chart of agents: structure forms around the task.",
		themes: [
			"recursive task decomposition",
			"dynamic subagent formation",
			"context routing and task-local memory",
			"recovery when workers fail",
			"verification of completed work",
			"long-horizon reliability",
		],
	},
	{
		title: "Autonomy Gate",
		tagline: "Controlling what tool-using agents are allowed to do.",
		status: "ongoing",
		summary:
			"A control layer between an agent and its tools: explicit allow and deny, approval-required actions, and a policy evaluator that reconstructs what the user actually asked for before judging a tool call. Tested against real failure cases, including an action that executed before the approval prompt showed it as authorised.",
		themes: [
			"allow / deny / approval-required actions",
			"LLM-based policy evaluation",
			"user-goal reconstruction",
			"human-in-the-loop approval",
			"prompt-injection and context-poisoning resistance",
		],
	},
	{
		title: "Evidence-first pentest agents",
		tagline: "Every finding resolves back to evidence.",
		status: "research",
		summary:
			"A local-first design for AI-assisted penetration testing in which scope is enforced deterministically, every tool runs through a governed adapter, and every conclusion links to append-only evidence. Built to support human testers, not replace them.",
		themes: [
			"deterministic scope and rules-of-engagement enforcement",
			"typed approvals and governed tool adapters",
			"append-only evidence",
			"injection and tool-poisoning resistance",
			"false-positive handling",
			"evidence-linked reporting",
		],
	},
	{
		title: "Governed cyber lab",
		tagline: "Agents that improve against benchmarks, inside hard limits.",
		status: "experiment",
		summary:
			"A research environment where agents, tools and workflows are evaluated and improved against benchmarks while staying constrained: short-lived least-privilege workers, verifiers kept separate from doers, and human approval for anything that touches the real world.",
		themes: [
			"orchestrator / worker architecture",
			"ephemeral least-privilege workers",
			"benchmark-driven evaluation",
			"verifier separation",
			"signed scope and rules of engagement",
		],
	},
	{
		title: "Private AI infrastructure",
		tagline: "Local and self-hosted inference for agent work.",
		status: "ongoing",
		summary:
			"Running models locally and in private cloud to back agent systems: what fits in memory, what it costs, and which numbers actually matter for interactive work.",
		themes: [
			"llama.cpp / llama-server and vLLM",
			"quantisation and context scaling",
			"concurrency, TTFT and throughput",
			"prefix caching and CPU offload",
			"Intel GPU inference",
			"cloud serving and cost / performance",
		],
	},
	{
		title: "Smaller builds",
		tagline: "Tools and systems from the lab.",
		status: "assorted",
		summary:
			"A small POSIX C99 system-information utility (Minifetch), a libp2p / QUIC secure-access prototype, home automation on Home Assistant and Zigbee, and self-hosted service orchestration for the lab itself.",
		themes: ["C99", "libp2p / QUIC", "Home Assistant", "homelab infrastructure"],
		href: "https://github.com/satunix",
	},
];
