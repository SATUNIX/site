/// <reference types="astro/client" />

interface ImportMetaEnv {
	/** "beta" for the Geist Pixel build (scripts/build-beta.mjs); unset for the stable site. */
	readonly PUBLIC_SITE_VARIANT?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
