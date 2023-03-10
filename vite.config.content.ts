import { appName, getFullVersion, r } from "./vite.utils";
import path from "path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(() => {
	const mode = process.env.NODE_ENV ?? "";
	const isDev = process.env.NODE_ENV === "dev";
	const isNightly = process.env.BRANCH === "nightly" || process.env.BRANCH === "beta";
	const outDir = process.env.OUT_DIR || "";
	const fullVersion = getFullVersion(isNightly);

	process.env = {
		...process.env,
		...loadEnv(mode, process.cwd()),
		VITE_APP_NAME: appName,
		VITE_APP_VERSION: fullVersion,
		VITE_APP_VERSION_BRANCH: process.env.BRANCH,
		VITE_APP_STYLESHEET_NAME: `seventv.style.${fullVersion}.css`,
	};

	return {
		mode,
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "src"),
			},
		},
		base: isDev ? "http://localhost:4777/" : "./",
		build: {
			emptyOutDir: false,
			outDir: "dist" + "/" + outDir,
			lib: {
				formats: ["iife"],
				entry: r("src/content/content.ts"),
				name: "seventv-content",
			},
			rollupOptions: {
				output: {
					entryFileNames: "content.js",
					extend: true,
				},
			},
		},
	};
});
