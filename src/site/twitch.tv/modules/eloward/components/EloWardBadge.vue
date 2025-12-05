<template>
	<div
		class="seventv-chat-badge eloward-rank-badge"
		:class="badgeClasses"
		@click="handleClick"
		@mouseenter="show(imgRef)"
		@mouseleave="hide()"
	>
		<img
			ref="imgRef"
			:src="badge.imageUrl"
			:srcset="srcset"
			:alt="`${badge.tier} rank badge`"
			class="eloward-badge-img"
			loading="eager"
			decoding="async"
			fetchpriority="high"
		/>
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useTooltip } from "@/composable/useTooltip";
import EloWardTooltip from "./EloWardTooltip.vue";
import { useEloWardRanks } from "../composables/useEloWardRanks";
import type { EloWardBadge } from "../composables/useEloWardRanks";

const props = defineProps<{
	badge: EloWardBadge;
	username: string;
}>();

const elowardRanks = useEloWardRanks();
const imgRef = ref<HTMLElement>();

// Use 7TV's tooltip system
const { show, hide } = useTooltip(EloWardTooltip, {
	badge: props.badge,
	username: props.username,
});

const badgeClasses = computed(() => ({
	[`eloward-${props.badge.tier.toLowerCase()}`]: true,
	"eloward-animated": props.badge.animated,
}));

// Generate srcset for responsive loading
const srcset = computed(() => {
	return `${props.badge.imageUrl} 1x, ${props.badge.imageUrl} 2x`;
});

// Click handler to open OP.GG
const handleClick = () => {
	// Use cached data if available
	const url = elowardRanks.getOpGGUrl({
		tier: props.badge.tier,
		division: props.badge.division,
		leaguePoints: props.badge.leaguePoints,
		summonerName: props.badge.summonerName,
		region: props.badge.region,
	});

	if (url) {
		window.open(url, "_blank");
	}
};
</script>

<style scoped lang="scss">
// Base badge container - exactly matches standard 7TV badges
.seventv-chat-badge.eloward-rank-badge {
	display: inline-block;
	vertical-align: baseline;
	cursor: pointer;
}

// Image - matches standard badge pattern
.eloward-badge-img {
	height: 18px;
	width: auto;
	vertical-align: middle;
}

// Rank-specific scaling - kept minimal
.eloward-iron .eloward-badge-img {
	transform: scale(1.15);
}

.eloward-bronze .eloward-badge-img {
	transform: scale(1.1);
}

.eloward-silver .eloward-badge-img {
	transform: scale(1.1);
}

.eloward-gold .eloward-badge-img {
	transform: scale(1.15);
}

.eloward-platinum .eloward-badge-img {
	transform: scale(1.15);
}

.eloward-emerald .eloward-badge-img {
	transform: scale(1.15);
}

.eloward-diamond .eloward-badge-img {
	transform: scale(1.05);
}

.eloward-master .eloward-badge-img {
	transform: scale(1.1);
}

.eloward-grandmaster .eloward-badge-img {
	transform: scale(1.05);
}

.eloward-challenger .eloward-badge-img {
	transform: scale(1.15);
}

// Theme adjustments
:global(.tw-root--theme-dark) .seventv-chat-badge.eloward-rank-badge {
	filter: brightness(0.95);
}

:global(.tw-root--theme-light) .seventv-chat-badge.eloward-rank-badge {
	filter: brightness(1.05) contrast(1.1);
}
</style>
