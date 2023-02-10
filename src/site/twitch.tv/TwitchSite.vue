<template>
	<template v-for="[key, mod] of Object.entries(modules)" :key="key">
		<ModuleWrapper :mod="mod" @mounted="onModuleUpdate(key as unknown as keyof ModuleComponentMap, $event)" />
	</template>
</template>

<script setup lang="ts">
import { onMounted, watch } from "vue";
import { useStore } from "@/store/main";
import { useComponentHook } from "@/common/ReactHooks";
import { useFrankerFaceZ } from "@/composable/useFrankerFaceZ";
import { getModule } from "@/composable/useModule";
import { synchronizeFrankerFaceZ, useConfig } from "@/composable/useSettings";
import { useUserAgent } from "@/composable/useUserAgent";
import ModuleWrapper from "./ModuleWrapper.vue";
import type { ModuleComponentMap, ModuleID } from "@/types/module";

const store = useStore();
const ua = useUserAgent();
const ffz = useFrankerFaceZ();
ffz.disableChatProcessing();

const useTransparency = useConfig("ui.transparent_backgrounds");
ua.preferredFormat = store.avifSupported ? "AVIF" : "WEBP";
store.setPreferredImageFormat(ua.preferredFormat);
store.setPlatform("TWITCH");

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

const disabled = [] as ModuleID[];

// Import modules
const modules = import.meta.glob("./modules/**/*Module.vue", { eager: true, import: "default" });
for (const key in modules) {
	const modPath = key.split("/");
	const modKey = modPath.splice(modPath.length - 2, 1).pop();

	if (disabled.includes(modKey as ModuleID)) {
		delete modules[key];
		continue;
	}

	modules[modKey!] = modules[key];
	delete modules[key];
}
const rootClasses = document.documentElement.classList;
watch(
	useTransparency,
	() => {
		useTransparency.value ? rootClasses.add("seventv-transparent") : rootClasses.remove("seventv-transparent");
	},
	{ immediate: true },
);

function onModuleUpdate(mod: ModuleID, inst: InstanceType<ComponentFactory>) {
	const modInst = getModule(mod);
	if (!modInst) return;

	modInst.instance = inst;
}

onMounted(() => {
	synchronizeFrankerFaceZ();
});
</script>
