import { reactive } from "vue";
import { semanticVersionToNumber } from "@/common/Transform";

class Updater {
	runtimeVersion = import.meta.env.VITE_APP_VERSION;
	latestVersion = import.meta.env.VITE_APP_VERSION;
	isUpToDate = true;
	private updateCheckRequested = false;

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

				if (!data.latestVersion) {
					reject(data.status);
				} else {
					resolve(data.latestVersion);

					this.latestVersion = data.latestVersion;
					this.checkUpdate();
				}

				window.removeEventListener("message", onResult);
			};

			window.addEventListener("message", (ev) => onResult(ev));

			window.postMessage({
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
