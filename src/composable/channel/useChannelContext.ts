import { inject, provide, reactive, toRaw } from "vue";
import { useStore } from "@/store/main";
import { log } from "@/common/Logger";
import { WorkletEvent, useWorker } from "../useWorker";

export const CHANNEL_CTX = Symbol("seventv-channel-context");

const { sendMessage, target } = useWorker();

export class ChannelContext {
	platform: Platform = "UNKNOWN";
	id = "";
	username = "";
	displayName = "";
	user: SevenTV.User | null = null;
	loaded = false;

	setCurrentChannel(channel: CurrentChannel): boolean {
		if (this.id === channel.id) return false;

		const oldID = this.id;

		this.id = channel.id;
		this.username = channel.username;
		this.displayName = channel.displayName;

		m.set(channel.id, this);
		m.delete(oldID);

		this.fetch();
		return true;
	}

	fetch(): void {
		// Listen for worker confirmation of channel fetch
		const onLoaded = (ev: WorkletEvent<"channel_fetched">) => {
			if (this.id !== ev.detail.id) return;

			this.loaded = true;
			this.user = ev.detail.user ?? null;

			log.info("Channel loaded:", this.id);
			target.removeEventListener("channel_fetched", onLoaded);
		};
		target.addEventListener("channel_fetched", onLoaded);

		// Notify the worker about this new channel we are on
		sendMessage("STATE", {
			channel: toRaw({
				id: this.id,
				username: this.username,
				displayName: this.displayName,
			}),
		});
	}
}

const m = new Map<string, ChannelContext>();

export function useChannelContext(channelID?: string): ChannelContext {
	let ctx = inject<ChannelContext | null>(CHANNEL_CTX, null);
	if (!ctx) {
		ctx = (channelID ? m.get(channelID) : null) ?? reactive<ChannelContext>(new ChannelContext());
		if (channelID) ctx.setCurrentChannel({ id: channelID ?? "", username: "", displayName: "" });

		const store = useStore();
		ctx.platform = store.platform;

		provide(CHANNEL_CTX, ctx);
		if (channelID) m.set(channelID, ctx);
	}

	return ctx;
}
