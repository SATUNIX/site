// CV content, kept apart from presentation. Everything here is yours to fill in.
//
// Leave arrays empty rather than inventing entries: the CV page shows an explicit
// "not filled in yet" state for any empty section. Plain ASCII text only.

export interface Role {
	title: string;
	org: string;
	/** Free text, e.g. "2023 - present". */
	period: string;
	/** Short bullet points: what you did and what changed because of it. */
	points: string[];
}

export interface Qualification {
	name: string;
	issuer: string;
	/** Free text, e.g. "2021". */
	year: string;
}

export interface Cv {
	/** Two or three sentences. `null` until written. */
	summary: string | null;
	experience: Role[];
	qualifications: Qualification[];
	/** Short skill groups, e.g. { label: "Languages", items: ["TypeScript", "Go"] }. */
	skills: { label: string; items: string[] }[];
}

export const cv: Cv = {
	summary: null,
	experience: [],
	qualifications: [],
	skills: [],
};
