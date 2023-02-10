import { defineStore } from "pinia";
import { useWorker } from "@/composable/useWorker";
import { IBrowser, UAParser, UAParserInstance } from "ua-parser-js";

export interface State {
	platform: Platform;
	theme: Theme;
	identity: (TwitchIdentity | YouTubeIdentity) | null;
	location: Twitch.Location | null;
	workers: {
		net: Worker | null;
	};
	agent: UAParserInstance;
}

type Theme = "LIGHT" | "DARK";

export const useStore = defineStore("main", {
	state: () =>
		({
			platform: "UNKNOWN",
			theme: "DARK",
			identity: null,
			location: null,
			agent: new UAParser(),
		} as State),

	actions: {
		setIdentity<T extends Platform>(platform: T, identity: PlatformIdentity<T> | null) {
			if (this.identity && identity && this.identity.id === identity.id) return; // no change.

			this.platform = platform;
			this.identity = identity;

			const { sendMessage } = useWorker();

			sendMessage("STATE", {
				identity: identity,
			});
		},

		setPreferredImageFormat(format: SevenTV.ImageFormat) {
			const { sendMessage } = useWorker();

			sendMessage("STATE", {
				imageFormat: format,
			});
		},

		setPlatform(platform: Platform) {
			this.platform = platform;

			const { sendMessage } = useWorker();

			sendMessage("STATE", {
				platform: platform,
			});
		},

		setLocation(location: Twitch.Location | null) {
			this.location = location;
		},
	},

	getters: {
		getIdentity<T extends Platform>(state: State) {
			return state.identity as PlatformIdentity<T>;
		},
		getLocation(state: State) {
			return state.location;
		},
		browser(): IBrowser {
			return this.agent.getBrowser();
		},
		avifSupported(): boolean {
			return this.browser.name === "Chrome" && parseInt(this.browser.version as string, 10) >= 100;
		},
	},
});
