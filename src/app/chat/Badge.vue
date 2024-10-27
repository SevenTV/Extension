<template>
	<div class="seventv-chat-badge">
		<img
			ref="imgRef"
			:srcset="srcset"
			:alt="alt"
			:style="{
				backgroundColor,
				borderRadius,
			}"
			@mouseenter="show(imgRef)"
			@mouseleave="hide()"
		/>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { TWITCH_PROFILE_IMAGE_REGEX } from "@/common/Constant";
import { useTooltip } from "@/composable/useTooltip";
import BadgeTooltip from "./BadgeTooltip.vue";

const props = defineProps<{
	alt: string;
	type: "twitch" | "picture" | "app";
	badge: Twitch.ChatBadge | Twitch.SharedChat | SevenTV.Cosmetic<"BADGE">;
}>();

const backgroundColor = ref("");
const borderRadius = ref("");
const srcset = {
	twitch: (badge: Twitch.ChatBadge) => `${badge.image1x} 1x, ${badge.image2x} 2x, ${badge.image4x} 4x`,
	picture: (badge: Twitch.SharedChat) =>
		`${badge.profileImageURL.replace(TWITCH_PROFILE_IMAGE_REGEX, "28x28")} 1.6x,
		${badge.profileImageURL.replace(TWITCH_PROFILE_IMAGE_REGEX, "70x70")} 3.8x`,
	app: (badge: SevenTV.Cosmetic<"BADGE">) =>
		badge.data.host.files.map((fi, i) => `https:${badge.data.host.url}/${fi.name} ${i + 1}x`).join(", "),
}[props.type](props.badge as SevenTV.Cosmetic<"BADGE"> & Twitch.SharedChat & Twitch.ChatBadge);

const imgRef = ref<HTMLElement>();

const { show, hide } = useTooltip(BadgeTooltip, {
	alt: props.alt,
});

function isApp(badge: typeof props.badge): badge is SevenTV.Cosmetic<"BADGE"> {
	return (badge as SevenTV.Cosmetic<"BADGE">).kind === "BADGE" && props.type === "app";
}

if (isApp(props.badge)) {
	backgroundColor.value = props.badge.data.backgroundColor ?? "";
}

if (typeof props.badge == "string") {
	borderRadius.value = "25%";
}
</script>

<style scoped lang="scss">
.seventv-chat-badge {
	display: inline-block;
	vertical-align: baseline;
}
</style>
