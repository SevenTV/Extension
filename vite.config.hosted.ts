import { appName, getFullVersion, r } from "./vite.utils";
import vuei18n from "@intlify/unplugin-vue-i18n/vite";
import vue from "@vitejs/plugin-vue";
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
		VITE_APP_STYLESHEET_NAME: `seventv.style.${fullVersion}.css`,
	};

	return {
		mode,
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "src"),
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
				fileName: () => `index.${fullVersion}.js`,
				name: "seventv-site",
			},
			rollupOptions: {
				output: {
					inlineDynamicImports: false,
					manualChunks: {
						tw: ["src/site/twitch.tv/TwitchSite.vue"],
					},
					assetFileNames: `seventv.[name].${fullVersion}[extname]`,
					chunkFileNames: `seventv.[name].${fullVersion}.js`,

					sanitizeFileName: (name: string) => name.toLowerCase(),
				},
			},
		},

		plugins: [
			vue(),
			vuei18n({
				include: r("./locale/*"),
			}),
		],
	};
});
