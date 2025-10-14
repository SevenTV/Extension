<template>
	<div
		class="seventv-chat-badge eloward-rank-badge"
		:class="badgeClasses"
		@click="handleClick"
		@mouseenter="handleMouseEnter"
		@mouseleave="handleMouseLeave"
	>
		<img
			:src="badge.imageUrl"
			:alt="`${badge.tier} rank badge`"
			class="eloward-badge-img"
			loading="eager"
			decoding="async"
		/>
		<div v-if="showTooltipLocal" class="eloward-tooltip-wrapper">
			<EloWardTooltip :badge="badge" :username="username" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import EloWardTooltip from "./EloWardTooltip.vue";
import { useEloWardRanks } from "../composables/useEloWardRanks";
import type { EloWardBadge } from "../composables/useEloWardRanks";

const props = defineProps<{
	badge: EloWardBadge;
	username: string;
}>();

const elowardRanks = useEloWardRanks();
const showTooltipLocal = ref(false);
let tooltipTimeout: number | null = null;

const badgeClasses = computed(() => ({
	[`eloward-${props.badge.tier.toLowerCase()}`]: true,
	"eloward-animated": props.badge.animated,
}));

// Tooltip handling with delay
const handleMouseEnter = () => {
	if (tooltipTimeout) {
		clearTimeout(tooltipTimeout);
	}
	// Small delay to prevent tooltip spam
	tooltipTimeout = window.setTimeout(() => {
		showTooltipLocal.value = true;
	}, 200);
};

const handleMouseLeave = () => {
	if (tooltipTimeout) {
		clearTimeout(tooltipTimeout);
		tooltipTimeout = null;
	}
	showTooltipLocal.value = false;
};

// Click handler to open OP.GG
const handleClick = () => {
	// Hide tooltip on click
	showTooltipLocal.value = false;

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
.eloward-rank-badge {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 20px;
	height: 20px;
	margin-right: 0.3rem;
	cursor: pointer;
	transition: transform 0.1s ease;
	position: relative;

	&:hover {
		transform: scale(1.1);
		z-index: 1000;
	}

	.eloward-badge-img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	// Support for animated WebP badges
	&.eloward-animated .eloward-badge-img {
		image-rendering: auto;
		image-rendering: crisp-edges;
		image-rendering: optimize-contrast;
	}

	.eloward-tooltip-wrapper {
		position: absolute;
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%);
		margin-bottom: 8px;
		z-index: 10000;
		pointer-events: none;
	}

	// Rank-specific positioning adjustments
	&.eloward-iron {
		transform: scale(1.3) translate(-1.5px, 1.5px);
		margin-right: 0;
	}

	&.eloward-bronze {
		transform: scale(1.2) translate(-1.5px, 3px);
		margin-right: 0;
	}

	&.eloward-silver {
		transform: scale(1.2) translate(-1.5px, 2.5px);
		margin-right: 0;
	}

	&.eloward-gold {
		transform: scale(1.22) translate(-1.5px, 3.5px);
		margin-right: 0;
	}

	&.eloward-platinum {
		transform: scale(1.22) translate(-1.5px, 4px);
		margin-left: 1px;
	}

	&.eloward-emerald {
		transform: scale(1.23) translate(-1.5px, 4px);
		margin-right: 0;
	}

	&.eloward-diamond {
		transform: scale(1.23) translate(-1.5px, 3.25px);
		margin-left: 2px;
		margin-right: 2px;
	}

	&.eloward-master {
		transform: scale(1.2) translate(-1.5px, 4px);
		margin-left: 1.5px;
		margin-right: 1.5px;
	}

	&.eloward-grandmaster {
		transform: scale(1.1) translate(-1.5px, 4.5px);
		margin-left: 1px;
		margin-right: 1px;
	}

	&.eloward-challenger {
		transform: scale(1.22) translate(-1.5px, 4px);
		margin-left: 2.5px;
		margin-right: 2.5px;
	}

	&.eloward-unranked {
		transform: scale(1) translate(-1.5px, 5px);
		margin-left: -1.5px;
		margin-right: -1.5px;
	}

	// Hover state adjustments
	&:hover {
		&.eloward-iron {
			transform: scale(1.4) translate(-1.5px, 1.5px);
		}

		&.eloward-bronze {
			transform: scale(1.3) translate(-1.5px, 3px);
		}

		&.eloward-silver {
			transform: scale(1.3) translate(-1.5px, 2.5px);
		}

		&.eloward-gold {
			transform: scale(1.32) translate(-1.5px, 3.5px);
		}

		&.eloward-platinum {
			transform: scale(1.32) translate(-1.5px, 4px);
		}

		&.eloward-emerald {
			transform: scale(1.33) translate(-1.5px, 4px);
		}

		&.eloward-diamond {
			transform: scale(1.33) translate(-1.5px, 3.25px);
		}

		&.eloward-master {
			transform: scale(1.3) translate(-1.5px, 4px);
		}

		&.eloward-grandmaster {
			transform: scale(1.2) translate(-1.5px, 4.5px);
		}

		&.eloward-challenger {
			transform: scale(1.32) translate(-1.5px, 4px);
		}

		&.eloward-unranked {
			transform: scale(1.1) translate(-1.5px, 5px);
		}
	}
}

// Dark theme adjustments
:global(.tw-root--theme-dark) .eloward-rank-badge {
	filter: brightness(0.95);
}

// Light theme adjustments
:global(.tw-root--theme-light) .eloward-rank-badge {
	filter: brightness(1.05) contrast(1.1);
}

// Mobile responsive
@media (width <= 400px) {
	.eloward-rank-badge {
		width: 18px;
		height: 18px;
		margin-right: 0.2rem;
	}
}
</style>
