import { displayName as name, version } from "./package.json";
import path from "path";
import { defineConfig, loadEnv } from "vite";

const r = (...args: string[]) => path.resolve(__dirname, ...args);

export default defineConfig(() => {
	const mode = process.env.NODE_ENV;

	process.env = {
		...process.env,
		...loadEnv(mode, process.cwd()),
		VITE_APP_NAME: name,
		VITE_APP_VERSION: version,
		VITE_APP_VERSION_BRANCH: process.env.BRANCH,
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
			outDir: "dist",
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
