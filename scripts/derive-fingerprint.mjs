#!/usr/bin/env node
// Derive the displayed OpenPGP fingerprint from public/keys/public.asc at build time.
//
// The gate: this script NEVER guesses key material. If the key is absent, gpg is missing,
// gpg fails, or no valid fingerprint can be parsed, it writes an explicit
// `{ "configured": false }` state and exits 0 so the build still succeeds.
//
// Output: src/data/fingerprint.json (committed; the unconfigured default is `false`).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ascPath = path.join(root, "public", "keys", "public.asc");
const outPath = path.join(root, "src", "data", "fingerprint.json");
const keyPath = "keys/public.asc";
const FINGERPRINT = /^(?:[0-9A-Fa-f]{40}|[0-9A-Fa-f]{64})$/;

function write(data) {
	fs.mkdirSync(path.dirname(outPath), { recursive: true });
	fs.writeFileSync(outPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function unconfigured(reason) {
	write({ configured: false });
	console.log(`derive-fingerprint: ${reason} -> configured:false`);
}

if (!fs.existsSync(ascPath)) {
	unconfigured("no public/keys/public.asc");
	process.exit(0);
}

let output;
try {
	output = execFileSync(
		"gpg",
		["--with-colons", "--import-options", "show-only", "--import", ascPath],
		{
			encoding: "utf8",
			stdio: ["ignore", "pipe", "pipe"],
		},
	);
} catch (error) {
	unconfigured(
		`gpg could not read the key (${error?.code ?? error?.message ?? "unknown error"})`,
	);
	process.exit(0);
}

// gpg --with-colons emits `fpr:::::::::<FINGERPRINT>:` records; field 10 (index 9) is the
// fingerprint. Take the primary key fingerprint (the first valid one).
const fingerprint = output
	.split("\n")
	.map((line) => line.split(":"))
	.filter((fields) => fields[0] === "fpr")
	.map((fields) => fields[9])
	.find((value) => typeof value === "string" && FINGERPRINT.test(value));

if (!fingerprint) {
	unconfigured("no valid 40/64-hex fingerprint found in the key");
	process.exit(0);
}

write({ configured: true, fingerprint: fingerprint.toUpperCase(), keyPath });
console.log(`derive-fingerprint: configured key ${fingerprint.toUpperCase()}`);
