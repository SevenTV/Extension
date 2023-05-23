<template>
	<button class="paint-tool-list-mod" :style="{ gridArea: modArea }" @click="add">
		<PlusIcon />
	</button>
	<div class="paint-tool-list" :style="{ gridArea: listArea }">
		<p>{{ gridArea.toUpperCase() }}</p>
		<div>
			<component
				:is="props.componentType"
				v-for="it of items"
				:id="it.index"
				:key="it.index"
				@delete="items.splice(items.indexOf(it), 1)"
				@update="[(it.data = $event), onUpdate()]"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { SetHexAlpha } from "@/common/Color";
import PlusIcon from "@/assets/svg/icons/PlusIcon.vue";

export interface PaintToolListItem {
	index: number;
	data: unknown;
}

const props = defineProps<{
	componentType: AnyInstanceType;
	gridArea: string;
	color: string;
}>();

const emit = defineEmits<{
	(e: "update", data: unknown[]): void;
}>();

const items = ref<PaintToolListItem[]>([]);

const modArea = ref("");
const listArea = ref("");
const colorAlpha = ref("");

function add(): void {
	items.value.push({
		index: items.value.length,
		data: {},
	});
}

watchEffect(() => {
	modArea.value = props.gridArea + "-mod";
	listArea.value = props.gridArea;
	colorAlpha.value = props.color + SetHexAlpha(0.075);
});

function onUpdate(): void {
	emit(
		"update",
		items.value.map((it) => it.data),
	);
}
</script>

<style scoped lang="scss">
$theme-color: v-bind(color);
$theme-color-alpha: v-bind(colorAlpha);

button.paint-tool-list-mod,
div.paint-tool-list {
	background-color: $theme-color-alpha;
}

button.paint-tool-list-mod {
	display: grid;
	place-items: center;
	font-size: 4rem;
	padding: 1rem;
	margin-right: 0.5rem;
	border-right: 0.25rem solid $theme-color;
	transition: filter 0.1s ease-in-out;

	svg {
		outline: 0.1rem solid $theme-color;
		background: var(--seventv-background-shade-3);
		color: $theme-color;
		border-radius: 0.25rem;
	}

	&:hover {
		filter: brightness(1.5);
	}
}

div.paint-tool-list {
	p {
		width: 100%;
		text-align: center;
		font-size: 1.5rem;
		font-weight: bold;
	}
}
</style>
