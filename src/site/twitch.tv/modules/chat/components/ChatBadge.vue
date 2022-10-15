<template>
	<div class="seventv-chat-badge">
		<img
			ref="imgRef"
			:src="badge.image1x"
			:srcset="srcset"
			:alt="badge.title"
			@mouseenter="show(imgRef)"
			@mouseleave="hide()"
		/>
	</div>
</template>

<script setup lang="ts">
import { useTooltip } from "@/composable/useTooltip";
import { ref } from "vue";
import ChatBadgeTooltip from "./ChatBadgeTooltip.vue";

const props = defineProps<{
	badge: Twitch.ChatBadge;
}>();

const srcset = `${props.badge.image1x} 1x, ${props.badge.image2x} 2x, ${props.badge.image4x} 4x`;

const imgRef = ref<HTMLElement>();

const { show, hide } = useTooltip(ChatBadgeTooltip, {
	badge: props.badge,
});
</script>

<style scoped lang="scss">
.seventv-chat-badge {
	display: inline-block;
	vertical-align: middle;
}
</style>
