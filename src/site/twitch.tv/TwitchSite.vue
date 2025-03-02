<template>
	<template v-for="[key, mod] of Object.entries(modules)" :key="key">
		<ModuleWrapper
			:mod="mod.default"
			@mounted="onModuleUpdate(key as unknown as TwModuleID, mod.config ?? [], $event)"
		/>
	</template>
</template>

<script setup lang="ts">
import { defineAsyncComponent, onMounted, provide, ref } from "vue";
import { useStore } from "@/store/main";
import { SITE_CURRENT_PLATFORM, SITE_NAV_PATHNAME } from "@/common/Constant";
import { useComponentHook, useElementFiberHook } from "@/common/ReactHooks";
import { useActor } from "@/composable/useActor";
import { useApollo } from "@/composable/useApollo";
import { useFrankerFaceZ } from "@/composable/useFrankerFaceZ";
import { getModule } from "@/composable/useModule";
import { synchronizeFrankerFaceZ, useSettings } from "@/composable/useSettings";
import { useUserAgent } from "@/composable/useUserAgent";
import type { TwModuleID } from "@/types/tw.module";
import type { ApolloClient } from "@apollo/client";

const ModuleWrapper = defineAsyncComponent(() => import("@/site/global/ModuleWrapper.vue"));

const store = useStore();
const actor = useActor();
const ua = useUserAgent();
const ffz = useFrankerFaceZ();
const apollo = useApollo();

ua.preferredFormat = store.avifSupported ? "AVIF" : "WEBP";
store.setPreferredImageFormat(ua.preferredFormat);
store.setPlatform("TWITCH", ["7TV", "FFZ", "BTTV"], ffz.active ? ["FFZ"] : []);

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
useComponentHook<Twitch.UserAndSessionUserComponent>(
	{
		predicate: (n) => {
			return !!n.props?.user || !!n.props?.sessionUser;
		},
		maxDepth: 200,
	},
	{
		hooks: {
			update: (inst) => {
				if (!inst.component || !inst.component.props) return;
				const user = inst.component.props.user ?? inst.component.props.sessionUser;
				store.setIdentity("TWITCH", {
					id: user.id,
					username: user.login,
					displayName: user.displayName,
				});
				actor.setPlatformUserID("TWITCH", user.id);
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

useElementFiberHook<{ client: ApolloClient<object> }>(
	{
		maxDepth: 50,
		predicate: (n) => !!(n.memoizedProps && n.memoizedProps.client && n.memoizedProps.client.query),
	},
	{
		hooks: {
			render(old, props, ref) {
				apollo.value = props.client;

				return old?.call(this, props, ref) ?? null;
			},
		},
	},
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
