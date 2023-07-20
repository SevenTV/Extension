<template>
	<div ref="sortMenuAnchorRef" :class="props.containerClass" @click="toggleShowSortBy">
		<BarsSortIcon />
	</div>
	<EmoteMenuSortContextMenu
		v-if="showSortMenu"
		:anchor="sortMenuAnchorRef"
		:on-close-dropdown="toggleShowSortBy"
		:ignored-clickout-refs="ignoredClickoutRefs"
	/>
</template>

<script setup lang="ts">
import { ref } from "vue";
import BarsSortIcon from "@/assets/svg/icons/BarsSortIcon.vue";
import EmoteMenuSortContextMenu from "./EmoteMenuSortContextMenu.vue";

const props = defineProps<{
	containerClass?: string;
}>();

const sortMenuAnchorRef = ref<HTMLDivElement>();
const showSortMenu = ref(false);
const ignoredClickoutRefs = ref([sortMenuAnchorRef]);

function toggleShowSortBy() {
	showSortMenu.value = !showSortMenu.value;
}
</script>

<style lang="scss">
.sort-button {
	display: grid;
	margin: 0.5rem;
	padding: 0.5rem;
	border-radius: 0.25rem;
	justify-content: center;
	cursor: pointer;

	&:hover {
		background: hsla(0deg, 0%, 50%, 32%);
	}

	> svg {
		height: 2rem;
		width: 2rem;
	}
}

.emote-search-icon.sort-icon {
	position: absolute;
	display: grid;
	align-items: center;
	top: 0;
	height: 100%;
	width: 3rem;
	padding: 0.85rem;

	> svg {
		height: 100%;
		width: 100%;
	}

	cursor: pointer;
	right: 1rem;
	color: var(--seventv-text-color-secondary);

	&:active,
	&:focus,
	&:hover {
		color: var(--seventv-text-color-normal);
	}
}
</style>
