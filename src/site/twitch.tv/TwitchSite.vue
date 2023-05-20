<template>
	<template v-for="[key, mod] of Object.entries(modules)" :key="key">
		<ModuleWrapper
			:mod="mod.default"
			@mounted="onModuleUpdate(key as unknown as TwModuleID, mod.config ?? [], $event)"
		/>
	</template>
</template>

<script setup lang="ts">
import { defineAsyncComponent, onMounted, provide, ref, watch } from "vue";
import { useStore } from "@/store/main";
import { SITE_CURRENT_PLATFORM, SITE_NAV_PATHNAME } from "@/common/Constant";
import { useComponentHook } from "@/common/ReactHooks";
import { useFrankerFaceZ } from "@/composable/useFrankerFaceZ";
import { getModule } from "@/composable/useModule";
import { synchronizeFrankerFaceZ, useConfig, useSettings } from "@/composable/useSettings";
import { useUserAgent } from "@/composable/useUserAgent";
import type { TwModuleID } from "@/types/tw.module";

const ModuleWrapper = defineAsyncComponent(() => import("@/site/global/ModuleWrapper.vue"));

const store = useStore();
const ua = useUserAgent();
const ffz = useFrankerFaceZ();

const useTransparency = useConfig("ui.transparent_backgrounds");
ua.preferredFormat = store.avifSupported ? "AVIF" : "WEBP";
store.setPreferredImageFormat(ua.preferredFormat);
store.setPlatform("TWITCH", ffz.active ? ["FFZ"] : []);

const currentPath = ref("");

provide(SITE_CURRENT_PLATFORM, "TWITCH");
provide(SITE_NAV_PATHNAME, currentPath);

// Import modules
const modules: Record<string, { default: ComponentFactory; config: SevenTV.SettingNode[] }> = import.meta.glob(
	"./modules/**/*Module.vue",
	{
		eager: true,
	},
);
for (const key in modules) {
	const modPath = key.split("/");
	const modKey = modPath.splice(modPath.length - 2, 1).pop();

	modules[modKey!] = modules[key];
	delete modules[key];
}

// Session User
useComponentHook<Twitch.SessionUserComponent>(
	{
		predicate: (n) => {
			return n.props?.sessionUser;
		},
	},
	{
		hooks: {
			update: (inst) => {
				if (inst.component && inst.component.props && inst.component.props.sessionUser) {
					store.setIdentity("TWITCH", {
						id: inst.component.props.sessionUser.id,
						username: inst.component.props.sessionUser.login,
						displayName: inst.component.props.sessionUser.displayName,
					});
				}
			},
		},
	},
);

// Router updates
useComponentHook<Twitch.RouterComponent>(
	{
		predicate: (n) => n.props && n.props.match && n.props.history,
	},
	{
		hooks: {
			update(v) {
				if (!v.component || !v.component.props || !v.component.props.location) return;

				currentPath.value = v.component.props.location.pathname;
			},
		},
	},
);

const rootClasses = document.documentElement.classList;

watch(
	useTransparency,
	() => {
		useTransparency.value ? rootClasses.add("seventv-transparent") : rootClasses.remove("seventv-transparent");
	},
	{ immediate: true },
);

const settings = useSettings();
function onModuleUpdate(mod: TwModuleID, config: SevenTV.SettingNode[], inst: InstanceType<ComponentFactory>) {
	const modInst = getModule(mod);
	if (!modInst) return;

	settings.register(config);
	modInst.instance = inst;
}

onMounted(() => {
	synchronizeFrankerFaceZ();
});
</script>
