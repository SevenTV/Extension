import { getManifest } from "./manifest.config";
import vue from "@vitejs/plugin-vue";
import { spawn } from "child_process";
import fs from "fs-extra";
import path from "path";
import { defineConfig, loadEnv } from "vite";

const r = (...args: string[]) => path.resolve(__dirname, ...args);

const chunks = {
	common: [
		"./src/common/Async.ts",
		"./src/common/Logger.ts",
		"./src/common/Rand.ts",
		"./src/common/Reflection.ts",
		"./src/common/Transform.ts",
		"./src/common/ReactHooks.ts",
	],
	store: ["./src/store/main.ts"],
	db: [
		"./src/db/idb.ts",
		"./src/db/versions.idb.ts",
		"./src/composable/useLiveQuery.ts",
		"./src/composable/useSettings.ts",
	],
	tw_mod_chat: ["./src/site/twitch.tv/modules/chat/ChatModule.vue"],
	tw_mod_chat_input: ["./src/site/twitch.tv/modules/chat-input/ChatInputModule.vue"],
	tw_mod_emote_menu: ["./src/site/twitch.tv/modules/emote-menu/EmoteMenuModule.vue"],
	tw_mod_settings: ["./src/site/twitch.tv/modules/settings/SettingsModule.vue"],
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
	const isDev = mode === "dev";
	process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

	if (isDev) {
		process.env.SITE_SCRIPT_URL = "http://localhost:4777/src/site/site.ts";
	}

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
		mode: "module",
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
			chunkSizeWarningLimit: 1000,
			rollupOptions: {
				input: {
					background: r("src/background.ts"),
					content: r("src/content/content.ts"),
					site: r("src/site/site.ts"),
				},
				output: {
					manualChunks: chunks,
					entryFileNames: (info) => {
						const name = path.basename(info.facadeModuleId.replace(".ts", ".js"));

						return name;
					},
					assetFileNames: "assets/[name][extname]",
					chunkFileNames: "assets/[name].js",
				},
			},
		},

		plugins: [
			vue(),

			{
				name: "compile-manifest",
				enforce: "post",
				apply: "build",
				async buildEnd() {
					const man = await getManifest(
						isDev || !!process.env.MV2,
						Object.keys(chunks)
							.map((key) => [`assets/${key}.js`, `assets/${key}.js.map`])
							.reduce((a, b) => [...a, ...b], []),
					);

					setTimeout(() => {
						fs.writeJSON(r("dist/manifest.json"), man);

						spawn("yarn", ["build:worker", "--mode", mode], { shell: true, stdio: "inherit" });
					});
				},
			},
		],
	};
});
