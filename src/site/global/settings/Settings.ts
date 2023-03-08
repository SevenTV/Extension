import { markRaw, reactive } from "vue";
import SettingsViewCompatVue from "./SettingsViewCompat.vue";
import SettingsViewConfigVue from "./SettingsViewConfig.vue";
import SettingsViewHomeVue from "./SettingsViewHome.vue";
import SettingsViewProfileVue from "./SettingsViewProfile.vue";

class SettingsMenuContext {
	open = false;
	view: ComponentFactory | null = null;

	category = "";
	scrollpoint = "";

	sortedNodes: SevenTV.SettingNode[] = [];
	mappedNodes: Record<string, Record<string, SevenTV.SettingNode[]>> = reactive({
		Home: {},
		Compatibility: {},
	});

	constructor() {
		this.switchView("home");
	}

	toggle(): void {
		this.open = !this.open;
	}

	switchView(name: keyof typeof views): void {
		this.view = markRaw(views[name]);
	}
}

const views = {
	home: SettingsViewHomeVue,
	config: SettingsViewConfigVue,
	profile: SettingsViewProfileVue,
	compat: SettingsViewCompatVue,
};

const inst = reactive(new SettingsMenuContext());
export function useSettingsMenu(): SettingsMenuContext {
	return inst;
}
