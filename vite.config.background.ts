import { appName, getFullVersion, r, versionID } from "./vite.utils";
import path from "path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(() => {
	const mode = process.env.NODE_ENV ?? "";
	const isNightly = process.env.BRANCH === "nightly" || process.env.BRANCH === "beta";

	process.env = {
		...process.env,
		...loadEnv(mode, process.cwd()),
		VITE_APP_NAME: appName,
		VITE_APP_VERSION: getFullVersion(isNightly),
		VITE_APP_VERSION_BRANCH: process.env.BRANCH,
		VITE_APP_STYLESHEET_NAME: `seventv.style.${versionID}.css`,
	};

	return {
		mode,
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "src"),
			},
		},
		build: {
			emptyOutDir: false,
			outDir: "dist",
			lib: {
				formats: ["iife"],
				entry: r("src/background/background.ts"),
				name: "seventv-background",
			},
			rollupOptions: {
				output: {
					entryFileNames: "background.js",
					extend: true,
				},
			},
		},
	};
});
