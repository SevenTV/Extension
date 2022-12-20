import path from "path";
import { defineConfig, loadEnv } from "vite";
import { getManifest } from "./manifest.config";
import fs from "fs-extra";
import vue from "@vitejs/plugin-vue";

const r = (...args: string[]) => path.resolve(__dirname, ...args);

const chunks = {
	composable: ["./src/composable/useModule.ts", "./src/composable/useSettings.ts", "./src/composable/useTooltip.ts"],
	common: [
		"./src/common/Async.ts",
		"./src/common/Logger.ts",
		"./src/common/Rand.ts",
		"./src/common/Reflection.ts",
		"./src/common/Transform.ts",
		"./src/common/ReactHooks.ts",
	],
	store: ["./src/store/main.ts"],
	db: ["./src/db/IndexedDB.ts"],
	tw_mod_chat: ["./src/site/twitch.tv/modules/chat/ChatModule.vue"],
	tw_mod_chat_input: ["./src/site/twitch.tv/modules/chat-input/ChatInputModule.vue"],
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
	const isDev = mode === "dev";
	process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

	return {
		server: {
			port: 4777,
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
						isDev,
						Object.keys(chunks).map((key) => `assets/${key}.js`),
					);

					setTimeout(() => {
						fs.writeJSON(r("dist/manifest.json"), man);
					}, 0);
				},
			},

			/*{
				name: "merge-css",
				enforce: "post",
				apply: "build",
				async closeBundle() {
					if (!fs.existsSync("dist/assets")) {
						return;
					}

					const files = await fs.readdir("dist/assets");

					fs.existsSync("dist/styles.css") && (await fs.truncate("dist/styles.css"));
					await fs.writeFile("dist/styles.css", "");

					for (const file of files) {
						if (!file.endsWith(".css")) {
							return;
						}

						await fs.appendFile("dist/styles.css", await fs.readFile(`dist/assets/${file}`, "utf-8"));
					}
				},
			},*/
		],
	};
});
