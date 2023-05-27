<template>
	<div v-if="ctx.mappedNodes[ctx.category]" class="seventv-settings-view-container">
		<UiScrollable>
			<div
				v-for="[key, nodes] of Object.entries(ctx.mappedNodes[ctx.category])"
				:key="key"
				class="seventv-settings-subcategory"
			>
				<SettingsViewConfigCat ref="subCats" :name="key" :nodes="nodes" />
			</div>
		</UiScrollable>
	</div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useSettingsMenu } from "./Settings";
import SettingsViewConfigCat from "./SettingsViewConfigCat.vue";
import UiScrollable from "@/ui/UiScrollable.vue";

const ctx = useSettingsMenu();
const subCats = ref<InstanceType<typeof SettingsViewConfigCat>[]>([]);

watch(
	() => ctx.scrollpoint,
	() => {
		// handle click on subcategory: scroll into view
		subCats.value.find((r) => r.name == ctx.scrollpoint)?.scrollIntoView();
	},
);
</script>
<style scoped lang="scss">
.seventv-settings-view-container {
	display: flex;
	flex-direction: column;
	height: 100%;
	width: 100%;

	> :first-child {
		flex-grow: 1;
	}
}

.seventv-settings-subcategory:last-child {
	margin-bottom: 30%;
}
</style>
