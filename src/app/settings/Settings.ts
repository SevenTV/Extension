import { defineAsyncComponent, markRaw, reactive } from "vue";
import { LOCAL_STORAGE_KEYS } from "@/common/Constant";
import SettingsViewBackupVue from "./SettingsViewBackup.vue";
import SettingsViewCompatVue from "./SettingsViewCompat.vue";
import SettingsViewConfigVue from "./SettingsViewConfig.vue";
import SettingsViewHomeVue from "./SettingsViewHome.vue";
import SettingsViewProfileVue from "./SettingsViewProfile.vue";

const PaintTool = defineAsyncComponent(() => import("@/app/paint-tool/PaintTool.vue"));
const Store = defineAsyncComponent(() => import("@/app/store/Store.vue"));

class SettingsMenuContext {
	open = false;
	view: AnyInstanceType | null = null;

	category = "";
	scrollpoint = "";
	intersectingSubcategory = "";
	seen = [] as string[];

	filter = "";

	mappedNodes: Record<string, Record<string, SevenTV.SettingNode[]>> = reactive({
		Home: {},
	});

	constructor() {
		this.switchView("home");

		const keys = localStorage.getItem(LOCAL_STORAGE_KEYS.SEEN_SETTINGS);
		if (keys) {
			for (const key of keys.split(",")) {
				this.seen.push(key);
			}
		}
	}

	toggle(): void {
		this.open = !this.open;
	}

	switchView(name: keyof typeof views): void {
		this.view = markRaw(views[name]);
	}

	markSettingAsSeen(...keys: string[]): void {
		for (const key of keys) {
			if (this.seen.indexOf(key) !== -1) continue;
			this.seen.push(key);
		}

		localStorage.setItem(LOCAL_STORAGE_KEYS.SEEN_SETTINGS, this.seen.join(","));
	}
}

export const views = {
	home: SettingsViewHomeVue,
	config: SettingsViewConfigVue,
	profile: SettingsViewProfileVue,
	compat: SettingsViewCompatVue,
	backup: SettingsViewBackupVue,
	store: Store,
	paint: PaintTool,
};

const inst = reactive(new SettingsMenuContext());
export function useSettingsMenu(): SettingsMenuContext {
	return inst;
}
