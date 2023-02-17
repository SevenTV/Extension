<template>
	<template v-for="(_, i) of commentList.instances" :key="i">
		<ChatVod
			v-if="isHookableDbc && shouldRenderVodChat && commentList.instances[i] && controller.instances[i]"
			:list="commentList.instances[i]"
			:controller="controller.instances[i]"
		/>
	</template>
</template>

<script setup lang="ts">
import { inject, ref, watch } from "vue";
import { refDebounced, watchDebounced } from "@vueuse/shared";
import { SITE_NAV_PATHNAME } from "@/common/Constant";
import { useComponentHook } from "@/common/ReactHooks";
import { declareModule } from "@/composable/useModule";
import { useConfig } from "@/composable/useSettings";
import ChatVod from "./ChatVod.vue";

declareModule("chat-vod", {
	name: "Chat VOD",
	depends_on: [],
	config: [
		{
			key: "chat.vods",
			label: "VOD Support",
			path: ["Chat", "VODs"],
			hint: "Enables 7TV rendering in the chat replay of VODs",
			type: "TOGGLE",
			defaultValue: true,
		},
	],
});

const shouldRenderVodChat = useConfig("chat.vods");
const pathname = inject(SITE_NAV_PATHNAME) ?? ref("");

const commentList = useComponentHook({
	parentSelector: ".video-chat",
	maxDepth: 20,
	predicate: (n) => n.props && n.props.children && n.props.onScrollBottom,
});

const controller = useComponentHook<Twitch.VideoChatComponent>(
	{
		parentSelector: ".chat-shell",
		maxDepth: 20,
		predicate: (n) => n.props && n.props.comments && typeof n.props.currentVideoTime === "number",
	},
	{
		trackRoot: true,
	},
);

const isHookable = ref(false);
const isHookableDbc = refDebounced(isHookable, 100);

watch(
	() => [controller.instances, commentList.instances],
	([controller, commentList]) => {
		isHookable.value = controller.length === commentList.length;
	},
	{ immediate: true },
);

// retry hooks upon path name changes
watchDebounced(
	pathname,
	() => {
		if (controller.instances.length && commentList.instances.length) return; // ok

		controller.retry();
		commentList.retry();
	},
	{ debounce: 1000 },
);
</script>
