<template>
	<div class="seventv-settings-view-container">
		<UiScrollable>
			<template v-if="ctx.mappedNodes[ctx.category]">
				<div
					v-for="[s, sn] of Object.entries(ctx.mappedNodes[ctx.category])"
					:key="s"
					class="seventv-settings-subcategory"
				>
					<h3 v-if="s" :id="s" ref="subcategoryRefs" class="seventv-settings-subcategory-header">
						{{ s }}
					</h3>
					<template v-for="node of sn" :key="node.key">
						<SettingsNode :node="node" />
					</template>
				</div>
			</template>
		</UiScrollable>
	</div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useSettingsMenu } from "./Settings";
import SettingsNode from "./SettingsNode.vue";
import UiScrollable from "@/ui/UiScrollable.vue";

const ctx = useSettingsMenu();
const subcategoryRefs = ref<HTMLElement[]>([]);

watch(
	() => ctx.scrollpoint,
	() => {
		subcategoryRefs.value.find((r) => r.id == ctx.scrollpoint)?.scrollIntoView();
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
.seventv-settings-subcategory {
	margin: 1rem;

	.seventv-settings-subcategory-header {
		display: flex;
		flex-direction: column;
		padding: 1rem;

		&:after {
			content: "";
			width: 100%;
			padding-bottom: 0.5rem;
			border-bottom: 0.1rem solid hsla(0deg, 0%, 70%, 32%);
		}
	}
	&:last-child {
		margin-bottom: 10rem;
	}
}
</style>
