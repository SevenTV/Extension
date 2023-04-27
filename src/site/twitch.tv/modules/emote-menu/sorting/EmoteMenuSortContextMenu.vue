<template>
	<UiFloating
		:anchor="props.anchor"
		placement="left-start"
		:middleware="[shift({ mainAxis: true, crossAxis: true })]"
		:emit-clickout="true"
		:ignored-clickout-refs="props.ignoredClickoutRefs"
		@clickout="props.onCloseDropdown"
	>
		<div class="sort-context-menu">
			<FormDropdown :node="emoteMenuSortProperties" :on-change="props.onCloseDropdown" />
			<FormDropdown :node="emoteMenuSortOrderProperties" :on-change="props.onCloseDropdown" />
		</div>
	</UiFloating>
</template>

<script setup lang="ts">
import { MaybeElementRef } from "@vueuse/core";
import FormDropdown from "@/site/global/settings/control/FormDropdown.vue";
import UiFloating from "@/ui/UiFloating.vue";
import { emoteMenuSortOrderProperties, emoteMenuSortProperties } from "../EmoteMenuContext";
import { shift } from "@floating-ui/dom";

const props = defineProps<{
	anchor?: Element;
	ignoredClickoutRefs?: (MaybeElementRef | string)[];
	onCloseDropdown: () => void;
}>();
</script>
<style scoped lang="scss">
.sort-context-menu {
	display: flex;
	flex-direction: column;
}
</style>
