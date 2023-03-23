import { BranchName, getManifest } from "./manifest.config";
import { appName, getFullVersion, r } from "./vite.utils";
import vuei18n from "@intlify/unplugin-vue-i18n/vite";
import vue from "@vitejs/plugin-vue";
import fs from "fs-extra";
import path from "path";
import { defineConfig, loadEnv } from "vite";

const ignoreHMR = [
	"index.ts",
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
	"SidebarPreviewsModule.vue",
];

const alwaysHot = ["src/background/background.ts"];

// https://vitejs.dev/config/
export default defineConfig(() => {
	const mode = process.env.NODE_ENV;
	const isDev = process.env.NODE_ENV === "dev";
	const isNightly = process.env.BRANCH === "nightly";
	const outDir = process.env.OUT_DIR || "";
	const fullVersion = getFullVersion(isNightly);

	process.env = {
		...process.env,
		...loadEnv(mode, process.cwd()),
		VITE_APP_NAME: appName,
		VITE_APP_VERSION: fullVersion,
		VITE_APP_VERSION_BRANCH: process.env.BRANCH as BranchName,
		VITE_APP_CHANGELOG: fs.readFileSync(
			r(
				{
					nightly: "CHANGELOG-nightly.md",
				}[process.env.BRANCH] ?? "CHANGELOG.md",
			),
			"utf-8",
		),
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
				"@locale": path.resolve(__dirname, "locale"),
				"vue-i18n": "vue-i18n/dist/vue-i18n.runtime.esm-bundler.js",
			},
		},

		root: ".",
		publicDir: "public",
		assetsInclude: ["**/*.md"],
		build: {
			outDir: "dist" + "/" + outDir,
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
			vuei18n({
				include: r("./locale/*"),
			}),

			{
				name: "hmr-ignore",
				handleHotUpdate(this, ctx) {
					const rel = path.relative(process.cwd(), ctx.file);
					if (alwaysHot.some((v) => v.startsWith(rel))) {
						ctx.server.ws.send("defined-match");
					}

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
						fs.writeJSON(r("dist").concat("/", outDir, "/", "manifest.json"), man);
					});
				},
			},
		],
	};
});
