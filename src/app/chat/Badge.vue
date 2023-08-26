<template>
	<div class="seventv-chat-badge">
		<img
			ref="imgRef"
			:srcset="srcset"
			:alt="alt"
			:style="{
				backgroundColor,
			}"
			@load="onImageLoad"
			@mouseenter="show(imgRef)"
			@mouseleave="hide()"
		/>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useTooltip } from "@/composable/useTooltip";
import BadgeTooltip from "./BadgeTooltip.vue";

const props = defineProps<{
	alt: string;
	type: "twitch" | "app";
	badge: Twitch.ChatBadge | SevenTV.Cosmetic<"BADGE">;
}>();

const backgroundColor = ref("");
const srcset = {
	twitch: (badge: Twitch.ChatBadge) => `${badge.image1x} 1x, ${badge.image2x} 2x, ${badge.image4x} 4x`,
	app: (badge: SevenTV.Cosmetic<"BADGE">) =>
		badge.data.host.files.map((fi, i) => `https:${badge.data.host.url}/${fi.name} ${i + 1}x`).join(", "),
}[props.type](props.badge as SevenTV.Cosmetic<"BADGE"> & Twitch.ChatBadge);

const imgRef = ref<HTMLElement>();

const imgEl = ref<HTMLImageElement>();

const src = ref("");

const baseWidth = ref(0);
const baseHeight = ref(0);

const onImageLoad = (event: Event) => {
	if (!(event.target instanceof HTMLImageElement)) return;

	const img = event.target;

	baseWidth.value = Math.round(img.naturalWidth / 1);
	baseHeight.value = Math.round(img.naturalHeight / 1);

	src.value = img.currentSrc;

	imgEl.value = img;
};

function isApp(badge: typeof props.badge): badge is SevenTV.Cosmetic<"BADGE"> {
	return (badge as SevenTV.Cosmetic<"BADGE">).kind === "BADGE" && props.type === "app";
}

if (isApp(props.badge)) {
	backgroundColor.value = props.badge.data.backgroundColor ?? "";
}

const { show, hide } = useTooltip(BadgeTooltip, {
	alt: props.alt,
	initSrc: src,
	src: srcset,
	width: baseWidth,
	height: baseHeight,
});
</script>

<style scoped lang="scss">
.seventv-chat-badge {
	display: inline-block;
	vertical-align: baseline;
}
</style>
