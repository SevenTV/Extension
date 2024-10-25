import { watch } from "vue";
import { useUrlSearchParams } from "@vueuse/core";
import { useSettings } from "./useSettings";
import { views as SettingView, useSettingsMenu } from "@/app/settings/Settings";

const params = useUrlSearchParams<{ seventv?: string }>();
const ctx = useSettingsMenu();
const { nodes } = useSettings();

type Fn = (...args: string[]) => void;
type Nav = { [key: string]: Nav | Fn };

const navigators: Nav = {
	settings: {
		key: (key: string) => {
			const node = nodes[key];
			if (!node || !node.path) return;
			ctx.switchView("config");
			ctx.category = node.path[0];
			ctx.filter = node.label;
			ctx.open = true;
		},
		view: (view: string) => {
			if (!(view in SettingView)) return;
			ctx.switchView(view as keyof typeof SettingView);
			ctx.open = true;
		},
		category: (category: string) => {
			ctx.switchView("config");
			ctx.category = category;
			ctx.open = true;
		},
		subcategory: (category: string, subcategory: string) => {
			ctx.switchView("config");
			ctx.category = category;
			ctx.scrollpoint = subcategory;
			ctx.open = true;
		},
	},
};

export function useNavigator() {
	return params;
}

function navigate() {
	if (!params.seventv) return;
	const par = params.seventv.split(":");
	let cur: Nav | Fn = navigators;
	while (par.length && typeof cur === "object") {
		const key = par.shift()!;
		if (!(key in cur)) return;
		cur = cur[key];
	}
	if (typeof cur === "function") {
		cur(...par);
	}
	delete params.seventv;
}

watch([params, nodes], navigate, { immediate: true });
