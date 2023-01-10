<template>
	<div
		v-for="msg of messages"
		:key="msg.id"
		:msg-id="msg.id"
		class="seventv-message"
		:class="{ mention: hasMention(msg) }"
	>
		<ModSlider v-if="isModSliderEnabled && canModerateType.includes(msg.type)" :msg="msg">
			<component :is="getMessageComponent(msg.type)" :msg="msg" />
		</ModSlider>
		<component :is="getMessageComponent(msg.type)" v-else :msg="msg" />
	</div>
</template>

<script setup lang="ts">
import { useConfig } from "@/composable/useSettings";
import { MessagePartType } from "@/site/twitch.tv/";
import { MessageType } from "@/site/twitch.tv/";
import ChatMessageUnhandled from "./ChatMessageUnhandled.vue";
import ModSlider from "./components/modslider/ModSlider.vue";

defineProps<{
	controller: Twitch.ChatControllerComponent | undefined;
	messages: Twitch.DisplayableMessage[];
}>();

const isModSliderEnabled = useConfig<boolean>("chat.mod_slider");

const types = import.meta.glob<object>("./components/types/*.vue", { eager: true, import: "default" });

function getMessageComponent(type: MessageType) {
	return types[`./components/types/${type}.${MessageType[type]}.vue`] ?? ChatMessageUnhandled;
}

function hasMention(msg: Twitch.DisplayableMessage) {
	const parts = msg.messageParts ?? msg.message?.messageParts;
	if (!parts) return false;
	return parts.some(
		(p) =>
			p.type == MessagePartType.CURRENTUSERHIGHLIGHT ||
			(p.type == MessagePartType.MENTION && p.content.currentUserMentionRelation === 1),
	);
}

const canModerateType = [MessageType.MESSAGE, MessageType.SUBSCRIPTION, MessageType.RESUBSCRIPTION];
</script>
<style scoped lang="scss">
.mention {
	box-shadow: inset 0 0 0.1rem 0.1rem red;
	background-color: #ff000040;
	border-radius: 0.5rem;
	margin-top: 0.5rem;
	margin-bottom: 0.5rem;
}
</style>
