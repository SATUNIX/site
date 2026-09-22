// Representative engagement types for the /work/ page. Plain ASCII text only.
//
// Rule: every entry describes a KIND of work carried out repeatedly, across many engagements and
// organisations. None refers to a specific client, sector, architecture or finding. Describe the
// class of problem and the approach, never a client's actual weaknesses.

export interface EngagementType {
	title: string;
	summary: string;
	/** What the work typically covers. */
	covers: string[];
}

export const workIntro =
	"Representative of work carried out repeatedly, across many engagements and organisations. No entry describes a specific client: each is a type of work, summarised from many instances of it.";

export const engagements: EngagementType[] = [
	{
		title: "Cloud assumed-breach assessments",
		summary:
			"Starting from an already-compromised workload and asking how far an attacker could get from there: which identities it can reach, which trust relationships it can abuse, and what it would take to stop them.",
		covers: [
			"identity and instance-metadata enumeration",
			"role assumption and privilege-escalation paths",
			"lateral movement and cross-account trust",
			"configuration weaknesses along the attack path",
			"evidence-driven remediation guidance",
		],
	},
	{
		title: "Internal network and Active Directory testing",
		summary:
			"Internal penetration testing of Windows domain environments, following credential and trust relationships the way a real intruder would.",
		covers: [
			"domain enumeration",
			"Kerberos attack paths",
			"Active Directory Certificate Services",
			"credential and trust relationships",
			"privilege escalation and lateral movement",
			"controlled command-and-control activity",
		],
	},
	{
		title: "Cloud security configuration reviews",
		summary:
			"Reviewing AWS environments for the configuration choices that decide how bad a compromise becomes, with automation where the checks repeat.",
		covers: [
			"IAM design and permissions",
			"instance metadata (IMDSv2) and STS",
			"storage and network controls",
			"benchmark-aligned review and automation",
		],
	},
	{
		title: "API and application security",
		summary:
			"Assessing web applications and APIs, including cloud API gateway deployments, with attention to where one trust boundary quietly depends on another.",
		covers: [
			"authentication and authorisation",
			"API exposure and gateway configuration",
			"trust boundaries between services",
			"application and API attack paths",
		],
	},
	{
		title: "Agentic AI security assessments",
		summary:
			"Assessing deployments of AI agents and the environments around them. The recurring question: what can the agent actually do, and who decided it should be able to?",
		covers: [
			"excessive tool authority",
			"privilege escalation through agent actions",
			"sensitive-data exposure and exfiltration paths",
			"access control around agents and their tools",
			"monitoring, governance and deployment configuration",
		],
	},
	{
		title: "Phishing simulation platform engineering",
		summary:
			"Designing, building and operating an offensive-security platform end to end, used across many simulation campaigns: front end, telemetry, cloud infrastructure, deployment and observability in one system.",
		covers: [
			"custom landing pages and client-side telemetry",
			"telemetry API and schema design",
			"cloud-hosted infrastructure",
			"GitOps and CI/CD deployment",
			"log ingestion and dashboards",
			"campaign operations and troubleshooting",
		],
	},
];
