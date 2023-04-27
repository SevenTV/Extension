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
