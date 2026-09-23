import type { AstroGlobal } from "astro";
import { describe, expect, it, vi } from "vitest";

import { cspHash, inlineScript, inlineStyle } from "./csp";

describe("cspHash", () => {
	it("matches the browser's sha256 source expression", () => {
		// Known value: sha256 of the empty string.
		expect(cspHash("")).toBe("sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=");
	});

	it("is sensitive to every byte, including whitespace", () => {
		expect(cspHash("a{}")).not.toBe(cspHash("a{} "));
	});
});

describe("inline helpers", () => {
	const fakeAstro = () => {
		const csp = { insertScriptHash: vi.fn(), insertStyleHash: vi.fn() };
		return { astro: { csp } as unknown as AstroGlobal, csp };
	};

	it("registers the script hash and returns the content unchanged", () => {
		const { astro, csp } = fakeAstro();
		expect(inlineScript(astro, "x()")).toBe("x()");
		expect(csp.insertScriptHash).toHaveBeenCalledWith(cspHash("x()"));
		expect(csp.insertStyleHash).not.toHaveBeenCalled();
	});

	it("registers the style hash and returns the content unchanged", () => {
		const { astro, csp } = fakeAstro();
		expect(inlineStyle(astro, "a{}")).toBe("a{}");
		expect(csp.insertStyleHash).toHaveBeenCalledWith(cspHash("a{}"));
	});

	it("is a no-op when CSP is disabled (dev server)", () => {
		expect(inlineStyle({} as AstroGlobal, "a{}")).toBe("a{}");
	});
});
