<template>
	<Suspense>
		<ChatController ref="controller" :channel-id="channelID" :slug="slug" />
	</Suspense>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { declareModule } from "@/composable/useModule";
import ChatController from "./ChatController.vue";
import { declareConfig } from "@/composable/useSettings";
import { useStaticRenderFunctionHook } from "@/common/ReactHooks";
import { Logger } from "@/common/Logger";
import { useChannelContext } from "@/composable/channel/useChannelContext";

const { markAsReady } = declareModule<"KICK">("chat", {
	name: "Chat",
	depends_on: [],
});

const slug = ref("");
const channelID = ref("");
useChannelContext(channelID.value);
watch(
	slug,
	async (v) => {
		if (!v) return;
		const resp = await fetch(`https://kick.com/api/v2/channels/${v}`).catch((err) => {
			Logger.Get().error("failed to fetch channel data", err);
		});
		if (!resp) return;
		const { user_id: id } = await resp.json();
		if (!id) return;
		channelID.value = id.toString() as string;
	},
	{ immediate: true },
);

useStaticRenderFunctionHook<{ channelSlug: string }>("#chatroom-messages", 2, function (this, old, props, ref) {
	slug.value = props.channelSlug;
	return old ? old.call(this, props, ref) : null;
});

markAsReady();
</script>

<script lang="ts">
export const config = [
	declareConfig("chat.alternating_background", "TOGGLE", {
		label: "settings.chat_alternating_background.label",
		hint: "settings.chat_alternating_background.hint",
		path: ["Chat", ""],
		defaultValue: false,
		effect(v) {
			document.documentElement.classList.toggle("seventv-alternating-chat-lines", v);
		},
	}),

	declareConfig("chat.message_batch_duration", "SLIDER", {
		path: ["Chat", "Performance"],
		label: "Message Batching",
		hint: "The time to wait between rendering new messages",
		options: {
			min: 25,
			max: 1000,
			step: 25,
			unit: "ms",
			named_thresolds: [
				[0, 50, "Instant"],
				[50, 250, "Fast"],
				[250, 500, "Balanced"],
				[500, 999, "Slow"],
				[1000, 1000, "PowerPoint Presentation"],
			],
		},
		defaultValue: 100,
	}),
	declareConfig<Set<string>>("ui.emote_menu.collapsed_sets", "NONE", {
		path: ["", ""],
		label: "",
		defaultValue: new Set(),
	}),
];
</script>
