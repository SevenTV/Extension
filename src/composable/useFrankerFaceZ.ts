import { reactive } from "vue";
import { log } from "@/common/Logger";
import { definePropertyHook } from "@/common/Reflection";

const data = reactive({
	active: false,
	ffz: null as FFZGlobalScope | null,
});

definePropertyHook(window as Window & { ffz?: FFZGlobalScope }, "ffz", {
	value(v) {
		if (!v) return;

		data.active = true;
		data.ffz = v;

		disableChatProcessing();
		log.info("FrankerFaceZ detected—patching for compatibility. woof");
	},
});

/**
 * Get a config value from FFZ
 */
function getConfig<T = unknown>(key: string): T | null {
	if (!data.ffz) return null;

	const settings = data.ffz.resolve<FFZSettingsManager>("settings");
	if (!settings || typeof settings.get !== "function") return null;

	return settings.get<T>(key) ?? null;
}

/**
 * Watch a config value from FFZ
 */
function getConfigChanges<T = unknown>(key: string, cb: (val: T) => void): void {
	if (!data.ffz) return;

	const settings = data.ffz.resolve<FFZSettingsManager>("settings");
	if (!settings || typeof settings.getChanges !== "function") return;

	return settings.getChanges<T>(key, cb);
}

function disableChatProcessing() {
	if (!data.ffz) return;

	const settings = data.ffz.resolve<FFZSettingsManager>("settings");
	if (!settings || typeof settings.main_context.updateContext !== "function") return;

	settings.main_context.updateContext({ "disable-chat-processing": true });
	log.info("Disabled chat processing in FrankerFaceZ (╯°□°）╯︵ ┻━┻)");
}

export function useFrankerFaceZ() {
	return reactive({
		active: data,
		getConfig,
		getConfigChanges,
		disableChatProcessing,
	});
}

export interface FFZGlobalScope {
	resolve<T>(key: string): T;
	settings: FFZSettingsManager;
}

export interface FFZSettingsManager {
	get<T = unknown>(key: string): T;
	getChanges<T = unknown>(key: string, cb: (val: T) => void): void;
	main_context: {
		updateContext(ctx: Record<string, unknown>): void;
	};
}
