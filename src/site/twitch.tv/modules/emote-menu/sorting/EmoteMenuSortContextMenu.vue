<template>
	<UiFloating :anchor="props.anchor" placement="left-start" :middleware="[shift({ mainAxis: true, crossAxis: true })]"
		:emit-clickout="true" @clickout="props.onCloseDropdown">
		<div class="sort-context-menu">
			<FormDropdown :node="emoteMenuSortProperties" :on-change="props.onCloseDropdown" />
			<FormDropdown :node="emoteMenuSortOrderProperties" :on-change="props.onCloseDropdown" />
		</div>
	</UiFloating>
</template>

<script setup lang="ts">
const props = defineProps<{
	anchor?: Element;
	onCloseDropdown: () => void;
}>();
import FormDropdown from "@/site/global/settings/control/FormDropdown.vue";
import { emoteMenuSortOrderProperties, emoteMenuSortProperties } from "../EmoteMenuContext";
import UiFloating from "@/ui/UiFloating.vue";
import { shift } from "@floating-ui/dom";
</script>
<style scoped lang="scss">
.sort-context-menu {
	display: flex;
	flex-direction: column;
}
</style>