<template>
	<div class="seventv-chat-badge eloward-rank-badge">
		<img
			ref="imgRef"
			:src="badge.imageUrl"
			:alt="badge.tooltip"
			loading="lazy"
			@mouseenter="showTooltip"
			@mouseleave="hideTooltip"
			@click="handleClick"
		/>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useTooltip } from "@/composable/useTooltip";
import type { EloWardBadge } from "../composables/useEloWardRanks";
import EloWardTooltip from "./EloWardTooltip.vue";

const props = defineProps<{
	badge: EloWardBadge;
	username: string;
}>();

const imgRef = ref<HTMLElement>();

const { show, hide } = useTooltip(EloWardTooltip, {
	badge: props.badge,
	username: props.username
});

function showTooltip() {
	if (imgRef.value) {
		show(imgRef.value);
	}
}

function hideTooltip() {
	hide();
}

function handleClick(event: MouseEvent) {
	event.preventDefault();
	event.stopPropagation();
	
	// Open EloWard website or user profile
	const url = `https://www.eloward.com/user/${props.username}`;
	window.open(url, '_blank');
}
</script>

<style scoped lang="scss">
.eloward-rank-badge {
	display: inline-block;
	vertical-align: middle;
	margin-right: 0.25em;
	cursor: pointer;
	
	img {
		width: 20px;
		height: 20px;
		object-fit: contain;
		vertical-align: middle;
		transition: transform 0.2s ease;
		
		&:hover {
			transform: scale(1.1);
		}
	}
}
</style>
