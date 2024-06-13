import { log } from "@/common/Logger";
import { convertPlatformEmoteSet } from "@/common/Transform";
import { WorkerDriver } from "./worker.driver";
import { TypedWorkerMessage, WorkerMessage, WorkerMessageType } from ".";

export class WorkerPort {
	id: symbol;
	seq = 0;

	platform: Platform | null = null;
	providers = new Set<SevenTV.Provider>();
	providerExtensions = new Set<SevenTV.Provider>();
	channels = new Map<string, CurrentChannel>();
	identity: TwitchIdentity | YouTubeIdentity | null = null;
	user: SevenTV.User | null = null;
	imageFormat: SevenTV.ImageFormat | null = null;

	constructor(
		private driver: WorkerDriver,
		private port: MessagePort,
	) {
		this.id = Symbol("seventv-worker-port");
		this.seq = driver.portSeq++ + 1;
		this.driver.log.debug(`Port opened: #${this.seq.toString()}`);

		port.addEventListener("message", (ev) => this.onMessage(ev));
		port.start();

		this.postMessage("INIT", {});
	}

	get channelIds(): string[] {
		return Array.from(this.channels.keys());
	}

	private onMessage(ev: MessageEvent) {
		const { type, data } = ev.data as WorkerMessage<WorkerMessageType>;

		switch (type) {
			case "STATE": {
				const { platform, providers, provider_extensions, identity, channel, user, imageFormat, refetch } =
					data as TypedWorkerMessage<"STATE">;

				if (platform) this.platform = platform;
				if (providers) this.providers = new Set(providers);
				if (provider_extensions) this.providerExtensions = new Set(provider_extensions);
				if (identity) {
					this.identity = identity;

					this.driver.emit("identity_updated", this.identity, this);
				}

				if (channel && channel.active && !this.channels.has(channel.id)) {
					this.channels.set(channel.id, channel);

					this.driver.log.debugWithObjects(["Channel added"], [channel]);
					this.driver.emit("join_channel", channel, this);
				} else if (channel && channel.active && refetch) {
					this.driver.log.debugWithObjects(["Channel refetched"], [channel]);
					this.driver.emit("join_channel", channel, this);
				} else if (channel && !channel.active && this.channels.has(channel.id)) {
					this.channels.delete(channel.id);

					this.driver.log.debugWithObjects(["Channel removed"], [channel]);
					this.driver.emit("part_channel", channel, this);
				}

				if (user) {
					this.user = user;

					this.driver.emit("user_updated", this.user, this);
				}
				if (imageFormat) {
					this.imageFormat = imageFormat;
					this.driver.emit("imageformat_updated", this.imageFormat, this);
				}

				break;
			}
			case "CHANNEL_ACTIVE_CHATTER": {
				const { channel } = data as TypedWorkerMessage<"CHANNEL_ACTIVE_CHATTER">;

				this.driver.emit("set_channel_presence", channel, this);
				break;
			}
			case "SYNC_TWITCH_SET": {
				const { input } = data as TypedWorkerMessage<"SYNC_TWITCH_SET">;
				if (!input) break;

				const set = convertPlatformEmoteSet(input);
				this.postMessage("SYNC_TWITCH_SET", { out: set });
				break;
			}
			case "REQUEST_USER_COSMETICS": {
				const { identifiers, kinds } = data as TypedWorkerMessage<"REQUEST_USER_COSMETICS">;
				if (!Array.isArray(identifiers) || !this.platform || !kinds.length) break;

				log.debugWithObjects(["Requesting cosmetics"], [identifiers, kinds]);
				this.driver.eventAPI.sendMessage({
					op: "BRIDGE",
					data: {
						command: "userstate",
						body: {
							identifiers: identifiers.map(([idType, id]) => `${idType}:${id}`),
							platform: this.platform,
							kinds,
						},
					},
				});
				break;
			}
			case "CLOSE":
				for (const channel of this.channels.values()) {
					this.driver.emit("part_channel", channel, this);
				}

				this.driver.ports.delete(this.id);
				this.driver.log.debug(`Port closed: #${this.seq.toString()}`);
				break;
		}
	}

	public postMessage<T extends WorkerMessageType>(type: T, data: TypedWorkerMessage<T>): void {
		this.port.postMessage({
			type: type,
			data: data,
		});
	}
}
