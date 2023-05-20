import { inject, onMounted, onUnmounted, provide, reactive, toRaw } from "vue";
import { useStore } from "@/store/main";
import { log } from "@/common/Logger";
import { WorkletEvent, useWorker } from "../useWorker";

export const CHANNEL_CTX = Symbol("seventv-channel-context");

const { sendMessage, target } = useWorker();

export type ChannelRole = "BROADCASTER" | "EDITOR" | "MODERATOR" | "VIP" | "SUBSCRIBER" | "FOLLOWER";

export class ChannelContext implements CurrentChannel {
	platform: Platform = "UNKNOWN";
	id = "";
	username = "";
	displayName = "";
	user?: SevenTV.User;
	loaded = false;
	active = false;
	count = 0;

	actor = {
		roles: new Set<ChannelRole>(),
	};

	get base(): CurrentChannel {
		return {
			id: this.id,
			username: this.username,
			displayName: this.displayName,
			active: this.active,
		};
	}

	setCurrentChannel(channel: CurrentChannel): boolean {
		// Notify the worker about this new channel we are on
		sendMessage("STATE", {
			channel: toRaw(this.base),
		});

		if (this.id === channel.id) {
			this.username = channel.username;
			this.displayName = channel.displayName;
			this.active = channel.active;

			return false;
		}

		const oldID = this.id;

		this.id = channel.id;
		this.username = channel.username;
		this.displayName = channel.displayName;
		this.active = channel.active;

		m.set(channel.id, this);
		m.delete(oldID);

		this.fetch();
		return true;
	}

	leave(): void {
		this.active = false;

		sendMessage("STATE", {
			channel: toRaw(this.base),
		});
	}

	fetch(): void {
		// Listen for worker confirmation of channel fetch
		const onLoaded = (ev: WorkletEvent<"channel_fetched">) => {
			if (this.id !== ev.detail.id) return;

			this.loaded = true;
			this.user = ev.detail.user;

			log.info("Channel loaded:", this.id);
			target.removeEventListener("channel_fetched", onLoaded);
		};
		target.addEventListener("channel_fetched", onLoaded);
	}
}

const m = new Map<string, ChannelContext>();

/**
 * @param channelID the ID of the current channel to use for the context
 * @param track if true, the mount state of the component will control the channel's activeness
 */
export function useChannelContext(channelID?: string, track = false): ChannelContext {
	let ctx = inject<ChannelContext | null>(CHANNEL_CTX, null);
	if (!ctx) {
		ctx = (channelID ? m.get(channelID) : null) ?? reactive<ChannelContext>(new ChannelContext());
		if (channelID) ctx.setCurrentChannel({ id: channelID ?? "", username: "", displayName: "", active: false });

		const store = useStore();
		ctx.platform = store.platform;

		provide(CHANNEL_CTX, ctx);
		if (channelID) m.set(channelID, ctx);
	}

	if (track) {
		onMounted(() => {
			if (!ctx) return;

			ctx.count++;
		});

		onUnmounted(() => {
			if (!ctx || !ctx.count) return;

			ctx.count--;
			if (ctx.count > 0) return;

			ctx.leave();
		});
	}

	return ctx;
}
