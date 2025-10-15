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

// Generate srcset for responsive loading (similar to 7TV badges)
const srcset = computed(() => {
	// For now, use the same image for all resolutions
	// In future, could add different resolution images
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
// Base badge container - matches Chrome Extension exactly
.seventv-chat-badge.eloward-rank-badge {
	display: inline-flex !important;
	justify-content: center !important;
	align-items: center !important;
	vertical-align: middle !important;
	cursor: pointer !important;
	transform: translateY(-3px) !important;
	transition: none !important;
	width: 20px !important;
	height: 20px !important;
	box-sizing: content-box !important;
	-webkit-user-select: none !important;
	user-select: none !important;
	-webkit-touch-callout: none !important;
	position: relative !important;
	overflow: visible !important;
}

// Image positioning - absolute with centered transform
.eloward-badge-img {
	display: block !important;
	width: 100% !important;
	height: 100% !important;
	object-fit: cover !important;
	transform-origin: center !important;
	position: absolute !important;
	top: 50% !important;
	left: 50% !important;
}

// IRON rank
.eloward-iron .eloward-badge-img {
	transform: translate(-50%, -50%) scale(1.3) translate(-1.5px, 1px) !important;
}
.eloward-iron {
	margin-right: -2.5px !important;
	margin-left: 2.5px !important;
}

// BRONZE rank
.eloward-bronze .eloward-badge-img {
	transform: translate(-50%, -50%) scale(1.2) translate(-1.5px, 2px) !important;
}
.eloward-bronze {
	margin-right: -2.5px !important;
	margin-left: 2.5px !important;
}

// SILVER rank
.eloward-silver .eloward-badge-img {
	transform: translate(-50%, -50%) scale(1.2) translate(-1.5px, 2px) !important;
}
.eloward-silver {
	margin-right: -1.5px !important;
	margin-left: 2.5px !important;
}

// GOLD rank
.eloward-gold .eloward-badge-img {
	transform: translate(-50%, -50%) scale(1.22) translate(-1.5px, 3px) !important;
}
.eloward-gold {
	margin-right: -1.5px !important;
	margin-left: 4px !important;
}

// PLATINUM rank
.eloward-platinum .eloward-badge-img {
	transform: translate(-50%, -50%) scale(1.22) translate(-1.5px, 3.5px) !important;
}
.eloward-platinum {
	margin-right: -0.5px !important;
	margin-left: 4px !important;
}

// EMERALD rank
.eloward-emerald .eloward-badge-img {
	transform: translate(-50%, -50%) scale(1.23) translate(-1.5px, 3.5px) !important;
}
.eloward-emerald {
	margin-right: -1px !important;
	margin-left: 3.5px !important;
}

// DIAMOND rank
.eloward-diamond .eloward-badge-img {
	transform: translate(-50%, -50%) scale(1.13) translate(-1.5px, 3.25px) !important;
}
.eloward-diamond {
	margin-right: 0px !important;
	margin-left: 4.5px !important;
}

// MASTER rank
.eloward-master .eloward-badge-img {
	transform: translate(-50%, -50%) scale(1.2) translate(-1.5px, 3.5px) !important;
}
.eloward-master {
	margin-right: -0.5px !important;
	margin-left: 4.5px !important;
}

// GRANDMASTER rank
.eloward-grandmaster .eloward-badge-img {
	transform: translate(-50%, -50%) scale(1.1) translate(-1.5px, 4px) !important;
}
.eloward-grandmaster {
	margin-right: -1px !important;
	margin-left: 3.5px !important;
}

// CHALLENGER rank
.eloward-challenger .eloward-badge-img {
	transform: translate(-50%, -50%) scale(1.22) translate(-1.5px, 4px) !important;
}
.eloward-challenger {
	margin-right: 0.5px !important;
	margin-left: 6px !important;
}

// UNRANKED
.eloward-unranked .eloward-badge-img {
	transform: translate(-50%, -50%) scale(1.0) translate(-1.5px, 4px) !important;
}
.eloward-unranked {
	margin-right: -3px !important;
	margin-left: 1.5px !important;
}

// Theme adjustments
:global(.tw-root--theme-dark) .seventv-chat-badge.eloward-rank-badge {
	filter: brightness(0.95) !important;
}

:global(.tw-root--theme-light) .seventv-chat-badge.eloward-rank-badge {
	filter: brightness(1.05) contrast(1.1) !important;
}

// Mobile responsive
@media (max-width: 400px) {
	.seventv-chat-badge.eloward-rank-badge {
		width: 20px !important;
		height: 20px !important;
		margin: 0 2px 0 0 !important;
	}
}
</style>
