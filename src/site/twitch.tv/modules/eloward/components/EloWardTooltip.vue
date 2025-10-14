<template>
	<div class="eloward-tooltip">
		<div class="eloward-tooltip-badge">
			<img :src="badge.imageUrl" :alt="`${badge.tier} rank`" class="eloward-tooltip-badge-img" />
		</div>
		<div class="eloward-tooltip-content">
			<div class="eloward-rank-line">{{ rankText }}</div>
			<div v-if="badge.summonerName" class="eloward-summoner-line">
				{{ badge.summonerName }}
			</div>
			<div v-if="regionDisplay" class="eloward-region-line">
				{{ regionDisplay }}
			</div>
			<div class="eloward-hint">Click to view on OP.GG</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useEloWardRanks } from "../composables/useEloWardRanks";
import type { EloWardBadge } from "../composables/useEloWardRanks";

const props = defineProps<{
	badge: EloWardBadge;
	username: string;
}>();

const elowardRanks = useEloWardRanks();

const rankText = computed(() => {
	let text = props.badge.tier;

	if (props.badge.division && !["MASTER", "GRANDMASTER", "CHALLENGER"].includes(props.badge.tier)) {
		text += ` ${props.badge.division}`;
	}

	if (props.badge.leaguePoints !== undefined && props.badge.leaguePoints !== null) {
		text += ` - ${props.badge.leaguePoints} LP`;
	}

	return text;
});

const regionDisplay = computed(() => {
	if (!props.badge.region) return "";
	return elowardRanks.getRegionDisplay(props.badge.region);
});
</script>

<style scoped lang="scss">
.eloward-tooltip {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 8px 12px;
	background: var(--color-background-tooltip);
	border-radius: 6px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	font-size: 13px;
	color: var(--color-text-base);
	max-width: 280px;

	.eloward-tooltip-badge {
		flex-shrink: 0;
		width: 48px;
		height: 48px;

		.eloward-tooltip-badge-img {
			width: 100%;
			height: 100%;
			object-fit: contain;
		}
	}

	.eloward-tooltip-content {
		flex: 1;
		min-width: 0;

		.eloward-rank-line {
			font-weight: 600;
			font-size: 14px;
			margin-bottom: 4px;
			color: var(--color-text-base);
		}

		.eloward-summoner-line {
			font-weight: 500;
			font-size: 12px;
			color: var(--color-text-alt);
			margin-bottom: 2px;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.eloward-region-line {
			font-weight: 400;
			font-size: 11px;
			color: var(--color-text-alt-2);
			margin-bottom: 6px;
		}

		.eloward-hint {
			font-size: 10px;
			color: var(--color-text-alt-2);
			font-style: italic;
			margin-top: 4px;
			padding-top: 4px;
			border-top: 1px solid var(--color-border-base);
		}
	}
}

// Dark theme
:global(.tw-root--theme-dark) .eloward-tooltip {
	background: rgba(24, 24, 27, 0.95);

	.eloward-rank-line {
		color: #efeff1;
	}

	.eloward-summoner-line {
		color: #adadb8;
	}

	.eloward-region-line,
	.eloward-hint {
		color: #848494;
	}
}

// Light theme
:global(.tw-root--theme-light) .eloward-tooltip {
	background: rgba(255, 255, 255, 0.98);

	.eloward-rank-line {
		color: #0e0e10;
	}

	.eloward-summoner-line {
		color: #53535f;
	}

	.eloward-region-line,
	.eloward-hint {
		color: #848494;
	}
}
</style>
