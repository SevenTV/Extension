<template>
	<template v-for="[key, mod] of Object.entries(modules)" :key="key">
		<ModuleWrapper :mod="mod.default" @mounted="onModuleUpdate(key as unknown as KickModuleID, $event)" />
	</template>
</template>

<script setup lang="ts">
import { provide } from "vue";
import { useStore } from "@/store/main";
import { SITE_CURRENT_PLATFORM } from "@/common/Constant";
import { getModule } from "@/composable/useModule";
import { useUserAgent } from "@/composable/useUserAgent";
import { KickModuleID } from "@/types/kick.module";
import ModuleWrapper from "../global/ModuleWrapper.vue";

const store = useStore();
const ua = useUserAgent();

ua.preferredFormat = store.avifSupported ? "AVIF" : "WEBP";
store.setPreferredImageFormat(ua.preferredFormat);
store.setPlatform("KICK", []);

document.body.setAttribute("seventv-kick", "true");

provide(SITE_CURRENT_PLATFORM, "KICK");
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

function onModuleUpdate(mod: KickModuleID, inst: InstanceType<ComponentFactory>) {
	const modInst = getModule(mod);
	if (!modInst) return;

	modInst.instance = inst;
}
</script>