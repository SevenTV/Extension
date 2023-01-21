<template>
	<template v-for="[key, mod] of Object.entries(modules)" :key="key">
		<component :is="mod" ref="renderedModules" />
	</template>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useStore } from "@/store/main";
import { useComponentHook } from "@/common/ReactHooks";
import { useChatProperties } from "@/composable/chat/useChatProperties";
import { getModule } from "@/composable/useModule";
import { synchronizeFrankerFaceZ } from "@/composable/useSettings";
import type { ModuleID } from "@/types/module";

const store = useStore();
const chatProperties = useChatProperties();
chatProperties.imageFormat = store.avifSupported ? "AVIF" : "WEBP";

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
						login: inst.component.props.sessionUser.displayName,
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderedModules = ref<Record<string, InstanceType<any>>>();

onMounted(() => {
	if (!renderedModules.value) return;
	for (let i = 0; i < renderedModules.value.length; i++) {
		const rmod = renderedModules.value[i];
		if (!rmod) continue;

		const modID = Object.keys(modules)[i];
		if (!modID) continue;

		const mod = getModule(modID as ModuleID);
		if (!mod) continue;

		mod.instance = rmod;
	}

	synchronizeFrankerFaceZ();
});
</script>
