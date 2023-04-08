<template>
	<template v-for="[key, mod] of Object.entries(modules)" :key="key">
		<ModuleWrapper
			:mod="mod.default"
			@mounted="onModuleUpdate(key as unknown as TwModuleID, mod.config ?? [], $event)"
		/>
	</template>
</template>

<script setup lang="ts">
import { onMounted, provide, ref, watch } from "vue";
import { useStore } from "@/store/main";
import { SITE_CURRENT_PLATFORM, SITE_NAV_PATHNAME } from "@/common/Constant";
import { useComponentHook } from "@/common/ReactHooks";
import { useFrankerFaceZ } from "@/composable/useFrankerFaceZ";
import { getModule } from "@/composable/useModule";
import { synchronizeFrankerFaceZ, useConfig, useSettings } from "@/composable/useSettings";
import { useUserAgent } from "@/composable/useUserAgent";
import type { TwModuleID } from "@/types/tw.module";
import ModuleWrapper from "../ModuleWrapper.vue";

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

const hideLeaderboard = useConfig<boolean>("general.hide_channel_leaderboard");
const hideButtonsBelowChatbox = useConfig<boolean>("general.hide_buttons_below_chatbox");
const hideStreamChatBar = useConfig<boolean>("general.hide_stream_chat_bar");
const hideReactButtons = useConfig<boolean>("general.hide_react_buttons");
const hideBitsButtons = useConfig<boolean>("general.hide_bits_buttons");
const hideTopBarOfStream = useConfig<boolean>("general.hide_top_bar_of_stream");
const hidePlayerControls = useConfig<boolean>("general.hide_player_controls");
const hideCommunityHighlights = useConfig<boolean>("general.hide_community_highlights");

document.body.classList.toggle("seventv-hide-leaderboard", hideLeaderboard.value);
document.body.classList.toggle("seventv-hide-buttons-below-chatbox", hideButtonsBelowChatbox.value);
document.body.classList.toggle("seventv-hide-stream-chat-bar", hideStreamChatBar.value);
document.body.classList.toggle("seventv-hide-react-buttons", hideReactButtons.value);
document.body.classList.toggle("seventv-hide-bits-buttons", hideBitsButtons.value);
document.body.classList.toggle("seventv-hide-top-bar-of-stream", hideTopBarOfStream.value);
document.body.classList.toggle("seventv-hide-player-controls", hidePlayerControls.value);
document.body.classList.toggle("seventv-hide-community-highlights", hideCommunityHighlights.value);

onMounted(() => {
	synchronizeFrankerFaceZ();

	watch(hideLeaderboard, () => {
		document.body.classList.toggle("seventv-hide-leaderboard", hideLeaderboard.value);
	});
	watch(hideButtonsBelowChatbox, () => {
		document.body.classList.toggle("seventv-hide-buttons-below-chatbox", hideButtonsBelowChatbox.value);
	});
	watch(hideStreamChatBar, () => {
		document.body.classList.toggle("seventv-hide-stream-chat-bar", hideStreamChatBar.value);
	});
	watch(hideReactButtons, () => {
		document.body.classList.toggle("seventv-hide-react-buttons", hideReactButtons.value);
	});
	watch(hideBitsButtons, () => {
		document.body.classList.toggle("seventv-hide-bits-buttons", hideBitsButtons.value);
	});
	watch(hideTopBarOfStream, () => {
		document.body.classList.toggle("seventv-hide-top-bar-of-stream", hideTopBarOfStream.value);
	});
	watch(hidePlayerControls, () => {
		document.body.classList.toggle("seventv-hide-player-controls", hidePlayerControls.value);
	});
	watch(hideCommunityHighlights, () => {
		document.body.classList.toggle("seventv-hide-community-highlights", hideCommunityHighlights.value);
	});
});
</script>

<style lang="scss">
.seventv-hide-leaderboard {
	div[data-test-selector="channel-leaderboard-container"] {
		display: none !important;
	}
}

.seventv-hide-buttons-below-chatbox {
	div[data-test-selector="chat-input-buttons-container"] {
		display: none !important;
	}
}

.seventv-hide-stream-chat-bar {
	button[data-a-target="right-column__toggle-collapse-btn"],
	div[class="Layout-sc-1xcs6mc-0 jBYVfx stream-chat-header"] {
		display: none !important;
	}
}

.seventv-hide-react-buttons {
	button[class="ScCoreButton-sc-ocjdkq-0 ScCoreButtonText-sc-ocjdkq-3 ibtYyW jYfhUy"] {
		display: none !important;
	}
}

.seventv-hide-bits-buttons {
	button[data-a-target="bits-button"],
	button[data-a-target="top-nav-get-bits-button"] {
		display: none !important;
	}
}

.seventv-hide-top-bar-of-stream {
	div[class="Layout-sc-1xcs6mc-0 nGhws top-bar"] {
		display: none !important;
	}
}

.seventv-hide-player-controls {
	div[data-a-target="player-controls"] {
		display: none !important;
	}
}

.seventv-hide-community-highlights {
	div[class="Layout-sc-1xcs6mc-0 kAIqwe"] {
		display: none !important;
	}
}
</style>
