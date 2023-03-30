import { reactive } from "vue";
import { APP_BROADCAST_CHANNEL } from "@/common/Constant";
import { semanticVersionToNumber } from "@/common/Transform";

const bc = new BroadcastChannel(APP_BROADCAST_CHANNEL);

class Updater {
	runtimeVersion = import.meta.env.VITE_APP_VERSION;
	latestVersion = import.meta.env.VITE_APP_VERSION;
	isUpToDate = true;
	updateReady = false;
	shouldRefreshOnUpdate = false;
	isDank = false;
	private updateCheckRequested = false;

	constructor() {
		bc.addEventListener("message", (msg) => {
			const { type, data } = msg.data;

			switch (type) {
				case "seventv-update-ready": {
					if (!data.version || this.updateReady) return;

					this.latestVersion = data.version;
					this.checkUpdate();

					// Reload the page
					this.updateReady = true;
					setTimeout(() => window.location.reload(), 3e3);
					break;
				}
			}
		});
	}

	checkUpdate(): boolean {
		return (this.isUpToDate = !(
			semanticVersionToNumber(this.latestVersion) > semanticVersionToNumber(this.runtimeVersion)
		));
	}

	async requestUpdateCheck(): Promise<string> {
		if (this.updateCheckRequested) return "";
		this.updateCheckRequested = true;

		return new Promise<string>((resolve, reject) => {
			const onResult = (ev: MessageEvent) => {
				const { type, data } = ev.data;
				if (type !== "seventv-update-check-result") return;

				if (!data.version) {
					reject(data.status);
				} else {
					resolve(data.version);

					this.latestVersion = data.version;
					this.checkUpdate();
				}

				bc.removeEventListener("message", onResult);
			};

			bc.addEventListener("message", (ev) => onResult(ev));

			bc.postMessage({
				type: "seventv-update-check",
				data: {},
			});
		});
	}
}

const updater = reactive(new Updater());

export default function useUpdater() {
	return updater;
}
