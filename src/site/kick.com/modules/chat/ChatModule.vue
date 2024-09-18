<template>
	<Suspense>
		<ChatController ref="controller" :slug="chan.slug" />
	</Suspense>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { declareModule } from "@/composable/useModule";
import { KickChannelInfo } from "@/site/kick.com";
import ChatController from "./ChatController.vue";
import { declareConfig } from "@/composable/useSettings";

const { markAsReady } = declareModule<"KICK">("chat", {
	name: "Chat",
	depends_on: [],
});

const controller = ref<InstanceType<typeof ChatController> | null>(null);

const chan = reactive<KickChannelInfo>({
	active: false,
	slug: "",
	currentMessage: "",
});

location.pathname.split("/");
const path = location.pathname.split("/");

let username = path[1];
if (username == "popout") {
	username = path[2];
}

chan.slug = username;

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
