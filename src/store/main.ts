import { defineStore } from "pinia";
import { useWorker } from "@/composable/useWorker";
import { IBrowser, UAParser, UAParserInstance } from "ua-parser-js";

export interface State {
	platform: Platform;
	providers: Set<SevenTV.Provider>;
	theme: Theme;
	identity: (TwitchIdentity | YouTubeIdentity | KickIdentity) | null;
	identityFetched: boolean;
	appUser: SevenTV.User | null;
	location: Twitch.Location | null;
	agent: UAParserInstance;
	workers: {
		net: Worker | null;
	};
}

type Theme = "LIGHT" | "DARK";

export const useStore = defineStore("main", {
	state: () =>
		({
			platform: "UNKNOWN",
			providers: new Set(),
			theme: "DARK",
			identity: null,
			identityFetched: false,
			appUser: null,
			location: null,
			agent: new UAParser(),
			workers: {
				net: null,
			},
		}) as State,

	actions: {
		setIdentity<T extends Platform>(platform: T, identity: PlatformIdentity<T> | null) {
			if (this.identity && identity && this.identity.id === identity.id) return; // no change.

			this.platform = platform;
			this.identity = identity;

			const { sendMessage, target } = useWorker();

			target.addEventListener(
				"identity_fetched",
				(ev) => {
					this.identityFetched = true;
					if (!ev.detail.user) return;

					this.appUser = ev.detail.user;
				},
				{ once: true },
			);

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

		setPlatform(platform: Platform, providers: SevenTV.Provider[], extensions: SevenTV.Provider[]) {
			this.platform = platform;
			this.providers = new Set(providers);

			const { sendMessage } = useWorker();

			sendMessage("STATE", {
				platform: platform,
				providers,
				provider_extensions: extensions,
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
			return (
				(this.browser.name === "Chrome" && parseInt(this.browser.version as string, 10) >= 100) ||
				(this.browser.name === "Firefox" && parseInt(this.browser.version as string, 10) >= 113)
			);
		},
	},
});
