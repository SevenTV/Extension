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

	const stylesheetFileName = `seventv.style.${fullVersion}.css`;
	const indexFileName = `index.${fullVersion}.js`;

	process.env = {
		...process.env,
		...loadEnv(mode, process.cwd()),
		VITE_APP_NAME: appName,
		VITE_APP_VERSION: fullVersion,
		VITE_APP_VERSION_BRANCH: process.env.BRANCH,
		VITE_APP_STYLESHEET_NAME: stylesheetFileName,
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
		build: {
			emptyOutDir: true,
			outDir: "dist-hosted" + "/" + outDir,
			lib: {
				formats: ["es"],
				entry: r("src/site/site.app.ts"),
				fileName: () => `v${fullVersion}/index.${fullVersion}.js`,
				name: "seventv-site",
			},
			rollupOptions: {
				output: {
					inlineDynamicImports: false,
					assetFileNames: `v${fullVersion}/seventv.[name].${fullVersion}[extname]`,
					chunkFileNames: `v${fullVersion}/seventv.[name].${fullVersion}.js`,

					sanitizeFileName: (name: string) => name.toLowerCase(),

					manualChunks: {
						"site.twitch.tv": ["src/site/twitch.tv/TwitchSite.vue"],
						"site.youtube.com": ["src/site/youtube.com/YouTubeSite.vue"],
						"site.global": ["src/site/global/Global.vue"],
					},
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
				async writeBundle(this) {
					const man = {
						version: getFullVersion(isNightly),
						index_file: `${process.env.VITE_APP_HOST}/v${fullVersion}/${indexFileName}`,
						stylesheet_file: `${process.env.VITE_APP_HOST}/v${fullVersion}/${stylesheetFileName}`,
					};

					const manifestName = process.env.BRANCH
						? `manifest.${process.env.BRANCH.toLowerCase()}.json`
						: "manifest.json";

					setTimeout(() => {
						fs.writeJSON(r("dist-hosted").concat("/", outDir, "/", manifestName), man);
					});
				},
			},
		],
	};
});
