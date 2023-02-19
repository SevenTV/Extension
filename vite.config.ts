import { BranchName, getManifest } from "./manifest.config";
import { displayName as name, version } from "./package.json";
import vue from "@vitejs/plugin-vue";
import { spawn } from "child_process";
import fs from "fs-extra";
import path from "path";
import { defineConfig, loadEnv } from "vite";

const r = (...args: string[]) => path.resolve(__dirname, ...args);

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
export default defineConfig(({ mode }) => {
	const isDev = mode === "dev";
	const versionSplit = version.split(".");
	const versionID =
		versionSplit.slice(0, 3).join("") + (versionSplit[3] ? `-${parseInt(versionSplit[3]) / 1000}` : "");

	process.env = {
		...process.env,
		...loadEnv(mode, process.cwd()),
		VITE_APP_NAME: name,
		VITE_APP_VERSION: version,
		VITE_APP_STYLESHEET_NAME: `seventv.style.${versionID}.css`,
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
		base: isDev ? "http://localhost:4777/" : undefined,
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
				input: {
					background: r("src/background.ts"),
					content: r("src/content/content.ts"),
					site: r("src/site/site.ts"),
				},
				output: {
					entryFileNames: (info) => {
						const name = path.basename(info.facadeModuleId.replace(".ts", ".js"));

						return name;
					},
					assetFileNames: `assets/seventv.[name].${versionID}[extname]`,
					chunkFileNames: `assets/seventv.[name].${versionID}.js`,
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
				async buildEnd(this) {
					const man = await getManifest({
						dev: isDev,
						branch: process.env.BRANCH as BranchName,
						mv2: isDev || !!process.env.MV2,
					});

					setTimeout(() => {
						fs.writeJSON(r("dist/manifest.json"), man);

						spawn("yarn", ["build:worker", "--mode", mode], { shell: true, stdio: "inherit" });
					});
				},
			},
		],
	};
});
