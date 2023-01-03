import { log } from "@/common/Logger";
import { useWorker, WorkletEvent } from "@/composable/useWorker";
import { defineStore } from "pinia";
import { UAParser, UAParserInstance, IBrowser } from "ua-parser-js";

export interface State {
	platform: Platform;
	identity: (TwitchIdentity | YouTubeIdentity) | null;
	location: Twitch.Location | null;
	channel: CurrentChannel | null;
	workers: {
		net: Worker | null;
	};
	agent: UAParserInstance;
}

export const useStore = defineStore("main", {
	state: () =>
		({
			platform: "UNKNOWN",
			identity: null,
			location: null,
			channel: null,
			agent: new UAParser(),
		} as State),

	actions: {
		setIdentity<T extends Platform>(platform: T, identity: PlatformIdentity<T> | null) {
			this.platform = platform;
			this.identity = identity;
		},

		setLocation(location: Twitch.Location | null) {
			this.location = location;
		},

		setChannel(channel: CurrentChannel | null): boolean {
			if (
				(channel === null && this.channel === null) ||
				(this.channel && channel && this.channel.id === channel.id)
			) {
				return false; // no change.
			}

			this.channel = channel;
			if (!this.channel) return true;

			const { sendMessage, target } = useWorker();

			// Set the "loaded" property once the worker has confirmed the channel has been fetched
			const onLoaded = (ev: WorkletEvent<"channel_fetched">) => {
				if (!this.channel || this.channel.id !== ev.detail.id) return;

				this.channel.loaded = true;

				log.info("Channel loaded:", this.channel.id);
				target.removeEventListener("channel_fetched", onLoaded);
			};
			target.addEventListener("channel_fetched", onLoaded);

			// Tell the worker we're now watching a new channel
			sendMessage("STATE", {
				identity: { ...this.identity } as TwitchIdentity | YouTubeIdentity,
				platform: this.platform,
				channel: this.channel && this.channel.id ? { ...this.channel } : null,
			});

			return true;
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
