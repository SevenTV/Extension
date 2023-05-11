<template>
	<div ref="catRef" :sticky="sticky" class="seventv-settings-view-subcategory">
		<h3 v-if="name" :id="name" ref="subcategoryRefs" class="seventv-settings-subcategory-header">
			{{ name }}
		</h3>
		<template v-for="n of nodes" :key="n.key">
			<SettingsNode :node="n" :unseen="unseen.has(n.key)" @seen="onMarkAsSeen(n.key)" />
		</template>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useIntersectionObserver } from "@vueuse/core";
import { useSettingsMenu } from "./Settings";
import SettingsNode from "./SettingsNode.vue";

const props = defineProps<{
	name: string;
	nodes: SevenTV.SettingNode<SevenTV.SettingType, SevenTV.SettingNode.ComponentType>[];
}>();

const ctx = useSettingsMenu();
const unseen = ref(new Set(props.nodes.map((n) => n.key).filter((k) => !ctx.seen.includes(k))));

const sticky = ref(false);
const catRef = ref<HTMLElement>();

// watch for scrolling into view
// this is used to highlight the subcategory in the dropdown
useIntersectionObserver(
	catRef,
	([entry]) => {
		sticky.value = entry.isIntersecting;

		if (!sticky.value) return;

		ctx.intersectingSubcategory = props.name;
		// Mark seen
		const nodes = entry.target.getElementsByClassName("seventv-settings-node");
		for (const node of Array.from(nodes)) {
			const key = node.getAttribute("data-key");
			if (!key) continue;

			ctx.markSettingAsSeen(key);
		}
	},
	{
		threshold: 0.75,
		rootMargin: "0px 0px -50% 0px",
	},
);

function onMarkAsSeen(key: string): void {
	unseen.value.delete(key);
	ctx.markSettingAsSeen(key);
}

function scrollIntoView(): void {
	catRef.value?.scrollIntoView({ block: "start" });
}

defineExpose({
	name: props.name,
	scrollIntoView,
});
</script>

<style scoped lang="scss">
.seventv-settings-subcategory-header {
	position: sticky;
	top: 0;
	background: var(--seventv-background-shade-2);
	border-bottom: 0.01rem solid var(--seventv-text-color-secondary);
	backdrop-filter: blur(0.25rem);
	z-index: 1;
	display: block;
	padding: 0.75rem 1rem;
	margin-bottom: 0.5rem;
}
</style>
