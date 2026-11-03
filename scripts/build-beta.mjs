#!/usr/bin/env node
// Build (or serve) the Geist Pixel beta: the same source with PUBLIC_SITE_VARIANT=beta, which
// astro.config.mjs turns into the beta base path (/<base>/<betaPath>) and output folder
// (dist/<betaPath>). Run after the stable build, which empties dist/ first.
//
//   node scripts/build-beta.mjs        production build into dist/beta/
//   node scripts/build-beta.mjs dev    dev server for the beta
//
// Uses Astro's JavaScript API so the variable is set the same way on every platform.
import { build, dev } from "astro";

process.env.PUBLIC_SITE_VARIANT = "beta";

if (process.argv[2] === "dev") {
	await dev({});
} else {
	await build({});
}
