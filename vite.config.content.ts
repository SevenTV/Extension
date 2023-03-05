import { appName, getFullVersion, r, versionID } from "./vite.utils";
import path from "path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(() => {
	const mode = process.env.NODE_ENV ?? "";
	const isDev = process.env.NODE_ENV === "dev";

	process.env = {
		...process.env,
		...loadEnv(mode, process.cwd()),
		VITE_APP_NAME: appName,
		VITE_APP_VERSION: getFullVersion(isDev),
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
		base: isDev ? "http://localhost:4777/" : "./",
		build: {
			emptyOutDir: false,
			outDir: "dist",
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
