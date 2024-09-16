<template>
	<Suspense>
		<ChatController ref="controller" :slug="chan.slug" />
	</Suspense>
</template>

<script setup lang="ts">
import { onMounted, provide, reactive, ref, watch } from "vue";
import { noop, useEventListener } from "@vueuse/core";
import { defineFunctionHook } from "@/common/Reflection";
import { declareModule } from "@/composable/useModule";
import { ChatRoom, KICK_CHANNEL_KEY, KickChannelInfo } from "@/site/kick.com";
import { useApp } from "@/site/kick.com/composable/useApp";
import { usePinia } from "@/site/kick.com/composable/usePinia";
import { useRouter } from "@/site/kick.com/composable/useRouter";
import ChatController from "./ChatController.vue";
import { declareConfig } from "@/composable/useSettings";

const { markAsReady } = declareModule<"KICK">("chat", {
	name: "Chat",
	depends_on: [],
});

// Acquire vue app
const app = useApp();

const controller = ref<InstanceType<typeof ChatController> | null>(null);

const chan = reactive<KickChannelInfo>({
	active: false,
	slug: "",
	currentMessage: "",
});

provide(KICK_CHANNEL_KEY, chan);

const CHAT_ROUTES = ["channel", "channel.chatroom", "moderation-dashboard", "dashboard.stream"];

let ok = false;
const stoppers: (typeof noop)[] = [];

location.pathname.split("/");
var path = location.pathname.split("/");

var username = path[1];
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
