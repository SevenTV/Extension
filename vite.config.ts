import { BranchName, getManifest } from "./manifest.config";
import { appName, getFullVersion, r } from "./vite.utils";
import vue from "@vitejs/plugin-vue";
import fs from "fs-extra";
import path from "path";
import { defineConfig, loadEnv } from "vite";

const ignoreHMR = [
	"main.ts",
	"idb.ts",
	"versions.idb.ts",
	"useModule.ts",
	"useWorker.ts",
	"App.vue",
	"TwitchSite.vue",
	"ChatModule.vue",
	"ChatController.vue",
	"ChatInputModule.vue",
	"EmoteMenuModule.vue",
	"SettingsModule.vue",
];

// https://vitejs.dev/config/
export default defineConfig(() => {
	const mode = process.env.NODE_ENV;
	const isDev = process.env.NODE_ENV === "dev";
	const isNightly = process.env.BRANCH === "nightly" || process.env.BRANCH === "beta";
	const fullVersion = getFullVersion(isNightly);

	process.env = {
		...process.env,
		...loadEnv(mode, process.cwd()),
		VITE_APP_NAME: appName,
		VITE_APP_VERSION: fullVersion,
		VITE_APP_VERSION_BRANCH: process.env.BRANCH as BranchName,
	};

	return {
		server: {
			port: 4777,
			strictPort: true,
			https: false,
			hmr: {
				port: 4778,
				protocol: "ws",
			},
		},
		mode,
		base: isDev ? "http://localhost:4777/" : "./",
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "src"),
			},
		},

		root: ".",
		publicDir: "public",
		build: {
			outDir: "dist",
			emptyOutDir: true,
			cssCodeSplit: false,
			write: true,
			sourcemap: isDev,
			chunkSizeWarningLimit: 10000,
			rollupOptions: {
				maxParallelFileOps: 100,
				input: {
					site: r("src/site/site.ts"),
					options: r("index.html"),
				},
				output: {
					entryFileNames: (info) => {
						switch (info.name) {
							// Options Page
							case "options":
								return `src/options/options${isDev ? "" : ".js"}`;
							// Catch-all, extension scripts
							default:
								return path.basename(info.facadeModuleId.replace(".ts", ".js"));
						}
					},
					assetFileNames: `assets/seventv.[name].${fullVersion}[extname]`,
					chunkFileNames: `assets/seventv.[name].${fullVersion}.js`,
				},
			},
		},

		plugins: [
			vue(),

			{
				name: "hmr-ignore",
				handleHotUpdate(this, ctx) {
					const base = path.basename(ctx.file);
					// Ignore specific files in HMR
					if (ignoreHMR.includes(base)) {
						ctx.server.ws.send("full-reload");

						return [];
					}

					return null;
				},
			},

			{
				name: "compile-manifest",
				enforce: "post",
				apply: "build",
				async writeBundle(this) {
					const man = await getManifest({
						version: getFullVersion(isNightly),
						dev: isDev,
						branch: process.env.BRANCH as BranchName,
						mv2: isDev || !!process.env.MV2,
					});

					setTimeout(() => {
						fs.writeJSON(r("dist/manifest.json"), man);
					});
				},
			},
		],
	};
});
