import { defineConfig, loadEnv } from "vite";
import path from "path";

const r = (...args: string[]) => path.resolve(__dirname, ...args);

export default defineConfig(({ mode }) => {
	process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

	process.stdout.write("Building worker...\n");

	return {
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
