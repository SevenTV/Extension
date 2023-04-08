import { appName, getFullVersion, r } from "./vite.utils";
import vuei18n from "@intlify/unplugin-vue-i18n/vite";
import vue from "@vitejs/plugin-vue";
import fs from "fs-extra";
import path from "path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(() => {
	const mode = process.env.NODE_ENV ?? "";
	const isNightly = process.env.BRANCH === "nightly";
	const outDir = process.env.OUT_DIR || "";
	const fullVersion = getFullVersion(isNightly);

	process.env = {
		...process.env,
		...loadEnv(mode, process.cwd()),
		VITE_APP_NAME: appName,
		VITE_APP_VERSION: fullVersion,
		VITE_APP_VERSION_BRANCH: process.env.BRANCH,
		VITE_APP_CHANGELOG: fs.readFileSync(
			r(
				{
					nightly: "CHANGELOG-nightly.md",
				}[process.env.BRANCH ?? ""] ?? "CHANGELOG.md",
			),
			"utf-8",
		),
	};

	return {
		mode,
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "src"),
				"@locale": path.resolve(__dirname, "locale"),
				"vue-i18n": "vue-i18n/dist/vue-i18n.runtime.esm-bundler.js",
			},
		},
		define: {
			"process.env": {},
		},
		base: process.env.VITE_APP_HOST + "/",
		build: {
			emptyOutDir: true,
			outDir: "dist-hosted" + "/" + outDir,
			minify: "terser",
			terserOptions: {
				mangle: true,
				compress: true,
			},
			chunkSizeWarningLimit: 1000,
			cssCodeSplit: false,
			rollupOptions: {
				input: {
					index: r("src/site/site.app.ts"),
				},
				output: {
					format: "es",
					inlineDynamicImports: false,
					entryFileNames: `v${fullVersion}/[name].${fullVersion}.[hash].js`,
					assetFileNames: `v${fullVersion}/seventv.[name].${fullVersion}.[hash][extname]`,
					chunkFileNames: `v${fullVersion}/seventv.[name].${fullVersion}.[hash].js`,

					sanitizeFileName: (name: string) => name.toLowerCase(),
				},
			},
		},

		plugins: [
			vue(),
			vuei18n({
				include: r("./locale/*"),
			}),

			// Create hosted manifest
			{
				name: "create-hosted-manifest",
				async writeBundle(this, _, bun) {
					let indexPath = "";
					let stylePath = "";

					for (const v of Object.values(bun)) {
						if (v.type === "asset" && v.fileName.includes("seventv.style")) {
							stylePath = v.fileName;
						} else if (v.type === "chunk" && v.fileName.includes("index")) {
							indexPath = v.fileName;
						}
					}

					const man = {
						version: getFullVersion(isNightly),
						index_file: `${process.env.VITE_APP_HOST}/${indexPath}`,
						stylesheet_file: `${process.env.VITE_APP_HOST}/${stylePath}`,
						worker_file: `${process.env.VITE_APP_HOST}/v${fullVersion}/worker.${fullVersion}.js`,
					};

					const manifestName = process.env.BRANCH
						? `manifest.${process.env.BRANCH.toLowerCase()}.json`
						: "manifest.json";

					setTimeout(() => {
						const p = r("dist-hosted") + (outDir ? "/" + outDir : "");

						// Copy worker to version scope (if it's there)
						const workerPath = r("dist/worker.js");
						if (fs.existsSync(workerPath)) {
							fs.copySync(workerPath, `${p}/v${fullVersion}/worker.${fullVersion}.js`);
						} else {
							man.worker_file = "";
						}

						// Set up manifest
						fs.writeJSONSync(p + "/" + manifestName, man);
					});
				},
			},
		],
	};
});
