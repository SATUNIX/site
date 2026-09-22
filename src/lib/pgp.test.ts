import { describe, expect, it } from "vitest";

import fingerprintJson from "@/data/fingerprint.json";
import {
	formatFingerprint,
	isPgpConfigured,
	type FingerprintData,
} from "./pgp";

const fingerprint = fingerprintJson as FingerprintData;

describe("fingerprint.json shape", () => {
	it("is a boolean-flagged object", () => {
		expect(typeof fingerprint).toBe("object");
		expect(fingerprint).not.toBeNull();
		expect(typeof fingerprint.configured).toBe("boolean");
	});

	it("only carries a fingerprint/keyPath when configured", () => {
		if (!fingerprint.configured) {
			// Unconfigured is the default committed state: no fabricated key material.
			expect(fingerprint.fingerprint).toBeUndefined();
			expect(isPgpConfigured()).toBe(false);
			return;
		}
		expect(typeof fingerprint.fingerprint).toBe("string");
		expect(fingerprint.fingerprint).toMatch(
			/^[0-9A-Fa-f]{40}$|^[0-9A-Fa-f]{64}$/,
		);
		expect(typeof fingerprint.keyPath).toBe("string");
		expect(isPgpConfigured()).toBe(true);
	});
});

describe("formatFingerprint", () => {
	it("groups hex into fours and uppercases", () => {
		expect(formatFingerprint("abc def0123456789abcdef0123456789abcdef01")).toBe(
			"ABCD EF01 2345 6789 ABCD EF01 2345 6789 ABCD EF01",
		);
	});

	it("handles an empty string without throwing", () => {
		expect(formatFingerprint("")).toBe("");
	});
});
