<template>
	<main ref="chatListEl" class="seventv-chat-list" :alternating-background="isAlternatingBackground">
		<div
			v-for="(msg, index) of messages.displayed"
			:key="msg.id"
			v-memo="[msg]"
			:msg-id="msg.id"
			class="seventv-message"
			:class="{
				// Even-odd alternating background
				...(isAlternatingBackground
					? {
							even: index % 2 == 0,
							odd: index % 2 == 1,
					  }
					: {}),
			}"
		>
			<ModSlider
				v-if="isModSliderEnabled && properties.isModerator && canModerateType.includes(msg.type)"
				:msg="msg"
			>
				<component :is="getMessageComponent(msg.type)" :msg="msg" />
			</ModSlider>
			<component :is="getMessageComponent(msg.type)" v-else :msg="msg" />
		</div>
	</main>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { Component } from "vue";
import { useDocumentVisibility } from "@vueuse/core";
import { useChatMessages } from "@/composable/chat/useChatMessages";
import { useChatProperties } from "@/composable/chat/useChatProperties";
import { useChatScroller } from "@/composable/chat/useChatScroller";
import { useConfig } from "@/composable/useSettings";
import { MessageType } from "@/site/twitch.tv/";
import ChatMessageUnhandled from "./ChatMessageUnhandled.vue";
import ModSlider from "./components/mod/ModSlider.vue";

defineProps<{
	controller: Twitch.ChatControllerComponent | undefined;
}>();

const messages = useChatMessages();
const scroller = useChatScroller();
const properties = useChatProperties();
const pageVisibility = useDocumentVisibility();

const isModSliderEnabled = useConfig<boolean>("chat.mod_slider");
const isAlternatingBackground = useConfig<boolean>("chat.alternating_background");

// Pause scrolling when page is not visible
const pausedByVisibility = ref(false);
watch(pageVisibility, (state) => {
	if (state === "hidden") {
		scroller.pause();
		pausedByVisibility.value = true;
	} else if (pausedByVisibility.value) {
		scroller.unpause();
		pausedByVisibility.value = false;
	}
});

// Unrender messages out of view
const chatListEl = ref<HTMLElement>();

const types = import.meta.glob<object>("./components/types/*.vue", { eager: true, import: "default" });
const typeMap = {} as Record<number, Component>;

const componentRegexp = /\.\/components\/types\/(\d+)\.(\w+)\.vue$/;
for (const [path, component] of Object.entries(types)) {
	const [, type] = path.match(componentRegexp) ?? [];
	if (!type) continue;

	const t = parseInt(type);
	if (Number.isNaN(t)) continue;

	typeMap[t] = component;
}

function getMessageComponent(type: MessageType) {
	return typeMap[type] ?? ChatMessageUnhandled;
}

const canModerateType = [
	MessageType.MESSAGE,
	MessageType.SUBSCRIPTION,
	MessageType.RESUBSCRIPTION,
	MessageType.RESTRICTED_LOW_TRUST_USER_MESSAGE,
];
</script>
<style scoped lang="scss">
.seventv-chat-list[alternating-background="true"] {
	padding: 0.5em 0;

	.seventv-message.even {
		background-color: var(--seventv-background-shade-1);
	}

	.seventv-message.odd {
		background-color: var(--seventv-background-shade-2);
	}
}

.seventv-chat-list.seventv-chat-list[alternating-background="false"] {
	padding: 1em 0;
}
</style>
