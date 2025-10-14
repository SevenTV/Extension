<template>
	<div
		class="seventv-chat-badge eloward-rank-badge"
		:class="badgeClasses"
		@click="handleClick"
		@mouseenter="showTooltip"
		@mouseleave="hideTooltip"
	>
		<img :src="badge.imageUrl" :alt="`${badge.tier} rank badge`" class="eloward-badge-img" loading="lazy" />
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useTooltip } from "@/composable/useTooltip";
import EloWardTooltip from "./EloWardTooltip.vue";
import { useEloWardRanks } from "../composables/useEloWardRanks";
import type { EloWardBadge } from "../composables/useEloWardRanks";

const props = defineProps<{
	badge: EloWardBadge;
	username: string;
}>();

const elowardRanks = useEloWardRanks();

const badgeClasses = computed(() => ({
	[`eloward-${props.badge.tier.toLowerCase()}`]: true,
	"eloward-animated": props.badge.animated,
}));

// Tooltip handling
const { show, hide } = useTooltip(EloWardTooltip, {
	badge: props.badge,
	username: props.username,
});

const showTooltip = (event: MouseEvent) => {
	if (elowardRanks.showTooltips.value) {
		show(event.target as HTMLElement);
	}
};

const hideTooltip = () => {
	if (elowardRanks.showTooltips.value) {
		hide();
	}
};

// Click handler to open OP.GG
const handleClick = () => {
	// Fetch the full rank data to get the OP.GG URL
	elowardRanks.fetchRankData(props.username).then((rankData) => {
		if (rankData) {
			const url = elowardRanks.getOpGGUrl(rankData);
			if (url) {
				window.open(url, "_blank");
			}
		}
	});
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

	&:hover {
		transform: scale(1.1);
	}

	.eloward-badge-img {
		width: 100%;
		height: 100%;
		object-fit: contain;
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
@media (max-width: 400px) {
	.eloward-rank-badge {
		width: 18px;
		height: 18px;
		margin-right: 0.2rem;
	}
}
</style>
