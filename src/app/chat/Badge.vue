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
import { useI18n } from "vue-i18n";
import { TWITCH_PROFILE_IMAGE_REGEX } from "@/common/Constant";
import { useTooltip } from "@/composable/useTooltip";
import BadgeTooltip from "./BadgeTooltip.vue";

export type TwitchChatBadgeWithData = Twitch.ChatBadge & { data?: string };

const props = defineProps<{
	alt: string;
	type: "twitch" | "picture" | "app";
	badge: TwitchChatBadgeWithData | Twitch.SharedChat | SevenTV.Cosmetic<"BADGE">;
}>();

const { t } = useI18n();

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

const tooltipProps: Record<string, unknown> = {
	alt: props.alt,
};

if (isSubscriber(props.badge)) {
	const version = parseInt(props.badge.version, 10);
	const months = parseInt(props.badge.data ?? "0", 10);
	const tier = !isNaN(version) ? Math.max(Math.floor(version / 1000), 0) : 0;

	if (months > 0) {
		const key = tier > 0 ? "badges.subscriber.tiered_months" : "badges.subscriber.months";

		tooltipProps.alt += ` (${t(key, months, { named: { tier, months } })})`;
	}
}

const { show, hide } = useTooltip(BadgeTooltip, tooltipProps);

function isApp(badge: typeof props.badge): badge is SevenTV.Cosmetic<"BADGE"> {
	return (badge as SevenTV.Cosmetic<"BADGE">).kind === "BADGE" && props.type === "app";
}

function isSubscriber(badge: typeof props.badge): badge is TwitchChatBadgeWithData {
	return props.type === "twitch" && "setID" in badge && (badge.setID === "subscriber" || badge.setID === "founder");
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
