<template>
	<template v-for="[key, mod] of Object.entries(modules)" :key="key">
		<ModuleWrapper :mod="mod" @mounted="onModuleUpdate(key as unknown as YtModuleID, $event)" />
	</template>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import { useStore } from "@/store/main";
import { getModule } from "@/composable/useModule";
import { useUserAgent } from "@/composable/useUserAgent";
import { YtModuleID } from "@/types/yt.module";

const ModuleWrapper = defineAsyncComponent(() => import("@/site/global/ModuleWrapper.vue"));

const store = useStore();
const ua = useUserAgent();

ua.preferredFormat = store.avifSupported ? "AVIF" : "WEBP";
store.setPreferredImageFormat(ua.preferredFormat);
store.setPlatform("YOUTUBE", []);

// Import modules
const modules = import.meta.glob("./modules/**/*Module.vue", { eager: true, import: "default" });

for (const key in modules) {
	const modPath = key.split("/");
	const modKey = modPath.splice(modPath.length - 2, 1).pop();

	modules[modKey!] = modules[key];
	delete modules[key];
}

function onModuleUpdate(mod: YtModuleID, inst: InstanceType<ComponentFactory>) {
	const modInst = getModule(mod);
	if (!modInst) return;

	modInst.instance = inst;
}
</script>
