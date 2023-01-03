<template>
	<div class="seventv-chat-badge">
		<img ref="imgRef" :srcset="srcset" :alt="alt" @mouseenter="show(imgRef)" @mouseleave="hide()" />
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useTooltip } from "@/composable/useTooltip";
import ChatBadgeTooltip from "./ChatBadgeTooltip.vue";

const props = defineProps<{
	alt: string;
	type: "twitch" | "app";
	badge: Twitch.ChatBadge | SevenTV.Cosmetic<"BADGE">;
}>();

const srcset = {
	twitch: (badge: Twitch.ChatBadge) => `${badge.image1x} 1x, ${badge.image2x} 2x, ${badge.image4x} 4x`,
	app: (badge: SevenTV.Cosmetic<"BADGE">) =>
		badge.data.host.files.map((fi, i) => `https:${badge.data.host.url}/${fi.name} ${i + 1}x`).join(", "),
}[props.type](props.badge as SevenTV.Cosmetic<"BADGE"> & Twitch.ChatBadge);

const imgRef = ref<HTMLElement>();

const { show, hide } = useTooltip(ChatBadgeTooltip, {
	badge: props.badge,
});
</script>

<style scoped lang="scss">
.seventv-chat-badge {
	display: inline-block;
	height: 1.8rem;
	width: 1.8rem;
	vertical-align: baseline;
}
</style>
