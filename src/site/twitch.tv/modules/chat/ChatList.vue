<template>
	<main class="seventv-chat-list" :alternating-background="isAlternatingBackground">
		<div
			v-for="(msg, index) of messages"
			:key="msg.id"
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
			<ModSlider v-if="isModSliderEnabled && canModerateType.includes(msg.type)" :msg="msg">
				<component :is="getMessageComponent(msg.type)" :msg="msg" />
			</ModSlider>
			<component :is="getMessageComponent(msg.type)" v-else :msg="msg" />
		</div>
	</main>
</template>

<script setup lang="ts">
import { useFrankerFaceZ } from "@/composable/useFrankerFaceZ";
import { useConfig } from "@/composable/useSettings";
import { MessageType } from "@/site/twitch.tv/";
import ChatMessageUnhandled from "./ChatMessageUnhandled.vue";
import ModSlider from "./components/mod/ModSlider.vue";

defineProps<{
	controller: Twitch.ChatControllerComponent | undefined;
	messages: Twitch.DisplayableMessage[];
}>();

useFrankerFaceZ();

const isModSliderEnabled = useConfig<boolean>("chat.mod_slider");
const isAlternatingBackground = useConfig<boolean>("chat.alternating_background");

const types = import.meta.glob<object>("./components/types/*.vue", { eager: true, import: "default" });

function getMessageComponent(type: MessageType) {
	return types[`./components/types/${type}.${MessageType[type]}.vue`] ?? ChatMessageUnhandled;
}

const canModerateType = [MessageType.MESSAGE, MessageType.SUBSCRIPTION, MessageType.RESUBSCRIPTION];
</script>
<style scoped lang="scss">
.seventv-chat-list[alternating-background="true"] {
	.seventv-message.even {
		background-color: var(--seventv-background-shade-1);
	}

	.seventv-message.odd {
		background-color: var(--seventv-background-shade-2);
	}
}
</style>
