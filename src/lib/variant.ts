// Which build this is: the stable site, or the Geist Pixel beta served under `site.betaPath`.
//
// `npm run build` makes both: the stable site into dist/, then scripts/build-beta.mjs runs a
// second build with PUBLIC_SITE_VARIANT=beta into dist/<betaPath>. astro.config.mjs reads the
// same variable to pick the base path and output directory.

/** True in the beta build. */
export const beta: boolean = import.meta.env.PUBLIC_SITE_VARIANT === "beta";
