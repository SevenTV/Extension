<template>
	<div class="eloward-tooltip">
		<div class="eloward-tooltip-badge">
			<img :src="badge.imageUrl" :alt="badge.tier" />
		</div>
		<div class="eloward-tooltip-text">
			<div class="eloward-rank-line">{{ rankText }}</div>
			<div v-if="badge.summonerName" class="eloward-summoner-line">{{ badge.summonerName }}</div>
			<div v-if="badge.region" class="eloward-region-line">{{ badge.region }}</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { EloWardBadge } from "../composables/useEloWardRanks";

const props = defineProps<{
	badge: EloWardBadge;
	username: string;
}>();

const rankText = computed(() => {
	const { tier, division, leaguePoints } = props.badge;
	
	let text = tier;
	if (division) {
		text += ` ${division}`;
	}
	if (leaguePoints > 0) {
		text += ` - ${leaguePoints} LP`;
	}
	
	return text;
});
</script>

<style scoped lang="scss">
.eloward-tooltip {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	padding: 12px;
	background-color: #0e0e10;
	color: #efeff1;
	border-radius: 8px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
	font-family: 'Roobert', 'Helvetica Neue', Helvetica, Arial, sans-serif;
	min-width: 120px;
}

.eloward-tooltip-badge {
	width: 60px;
	height: 60px;
	
	img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
}

.eloward-tooltip-text {
	text-align: center;
	font-size: 13px;
	line-height: 1.3;
}

.eloward-rank-line {
	font-weight: 600;
	color: #efeff1;
}

.eloward-summoner-line {
	font-weight: 500;
	color: #d9a336;
	margin-top: 2px;
}

.eloward-region-line {
	font-weight: 300;
	font-size: 11px;
	color: #a09b8c;
	margin-top: 2px;
}
</style>
