<template>
	<div class="settings-area-container">
		<UiScrollable>
			<template v-if="nodes[category]">
				<div v-for="[s, sn] of Object.entries(nodes[category])" :key="s" class="subcategory">
					<div class="testt">
						<h3 v-if="s" :id="s" ref="subcategoryRefs" class="subcategory-header">
							{{ s }}
						</h3>
						<template v-for="node of sn" :key="node.key">
							<SettingsNode :node="node" />
						</template>
					</div>
				</div>
			</template>
		</UiScrollable>
	</div>
</template>

<script setup lang="ts">
import { ref, toRef, watch } from "vue";
import UiScrollable from "@/ui/UiScrollable.vue";
import SettingsNode from "../SettingsNode.vue";

const props = defineProps<{
	category: string;
	nodes: Record<string, Record<string, SevenTV.SettingNode[]>>;
	scrollpoint?: string;
}>();

const scrollpoint = toRef(props, "scrollpoint");
const subcategoryRefs = ref<HTMLElement[]>([]);

watch(scrollpoint, () => {
	subcategoryRefs.value.find((r) => r.id == props.scrollpoint)?.scrollIntoView();
});
</script>
<style scoped lang="scss">
.settings-area-container {
	display: flex;
	flex-direction: column;
	height: 100%;
	width: 100%;
	> :first-child {
		flex-grow: 1;
	}
}
.subcategory {
	background-color: hsla(0deg, 0%, 30%, 6%);
	margin: 1rem;
	border-radius: 0.4rem;

	.subcategory-header {
		display: flex;
		flex-direction: column;
		padding: 1rem;

		&:after {
			content: "";
			width: 100%;
			border-bottom: 1px solid hsla(0deg, 0%, 70%, 32%);
		}
	}
	&:last-child {
		margin-bottom: 10rem;
	}
}
</style>
