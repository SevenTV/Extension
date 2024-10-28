import { displayName as name } from "./package.json";
import { getFullVersion } from "./vite.utils";
import path from "path";
import { defineConfig, loadEnv } from "vite";

const r = (...args: string[]) => path.resolve(__dirname, ...args);

export default defineConfig(() => {
	const mode = process.env.NODE_ENV;
	const outDir = process.env.OUT_DIR || "";
	const isNightly = process.env.BRANCH === "nightly";
	const fullVersion = getFullVersion(isNightly);

	process.env = {
		...process.env,
		...loadEnv(mode, process.cwd()),
		VITE_APP_NAME: name,
		VITE_APP_VERSION: fullVersion,
		VITE_APP_VERSION_BRANCH: process.env.BRANCH || "",
	};

	process.stdout.write("Building worker...\n");

	return {
		mode,
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "src"),
			},
		},

		root: ".",
		build: {
			outDir: "dist" + "/" + outDir,
			emptyOutDir: false,
			write: true,
			rollupOptions: {
				input: {
					worker: r("src/worker/worker.root.ts"),
				},
				output: {
					entryFileNames: "worker.js",
				},
			},
		},
	};
});
