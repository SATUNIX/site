import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Vitest only runs the pure logic modules (base-path helpers, fingerprint shape).
// Astro pages/components are covered by `astro check` + a production build + check-site.
export default defineConfig({
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	test: {
		include: ["src/**/*.test.ts"],
		environment: "node",
	},
});
