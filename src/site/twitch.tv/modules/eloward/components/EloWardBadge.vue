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
.eloward-rank-badge {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 20px;
	height: 20px;
	margin-right: 0.3rem;
	cursor: pointer;
	position: relative;

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
