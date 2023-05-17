<template>
	<div class="seventv-settings-category" :in-view="ctx.category === category" :open="open">
		<div tabindex="0" class="settings-category-header" @click="onCategoryClick()">
			<div class="seventv-settings-category-icon">
				<IconForSettings :name="category" />
			</div>
			<span class="seventv-settings-expanded">
				{{ category }}
				<span class="seventv-settings-category-contains-unseen">{{ hasUnseen ? "•" : "" }}</span>
			</span>
			<div
				v-if="showSubCategories && subCategories.filter((s) => s).length"
				class="dropdown-icon seventv-settings-expanded"
			>
				<DropdownIcon />
			</div>
		</div>
		<div v-if="showSubCategories" class="seventv-settings-category-dropdown seventv-settings-expanded">
			<template v-for="s of subCategories" :key="s">
				<div
					v-if="s"
					class="seventv-settings-subcategory"
					:class="{
						intersect: ctx.intersectingSubcategory === s,
					}"
					@click="emit('open-subcategory', s)"
				>
					{{ s }}
				</div>
			</template>
		</div>
	</div>
</template>
<script setup lang="ts">
import { ref, watch } from "vue";
import DropdownIcon from "@/assets/svg/icons/DropdownIcon.vue";
import IconForSettings from "@/assets/svg/icons/IconForSettings.vue";
import { useSettingsMenu } from "./Settings";

const props = defineProps<{
	category: string;
	subCategories: string[];
	showSubCategories?: boolean;
}>();

const emit = defineEmits<{
	(event: "open-category"): void;
	(event: "open-subcategory", subcategory: string): void;
}>();

const ctx = useSettingsMenu();
const open = ref(false);

const hasUnseen = ref(false);

watch(
	ctx.seen,
	(s) => {
		let sawUnseen = false;
		for (const [, nodes] of Object.entries(ctx.mappedNodes[props.category] ?? {})) {
			for (const node of nodes) {
				if (s.includes(node.key) || node.type === "NONE") continue;

				sawUnseen = true;
				break;
			}
			break;
		}
		hasUnseen.value = sawUnseen;
	},
	{ immediate: true },
);

function onCategoryClick(): void {
	if (props.showSubCategories && !(open.value = !open.value)) return;

	emit("open-category");
}
</script>
<style scoped lang="scss">
.seventv-settings-category {
	border-radius: 0.4rem;
	margin: 0.5rem;

	.settings-category-header {
		cursor: pointer;
		display: grid;
		grid-template-columns: 3rem 1fr 3rem;
		border-radius: 0.4rem;
		height: 4rem;
		padding: 0.25rem;
		column-gap: 0.5rem;
		align-items: center;
		font-weight: 600;
		font-size: 1.6rem;

		&:hover,
		&:focus-within {
			background-color: hsla(0deg, 0%, 20%, 10%);
		}

		svg {
			height: 100%;
			width: 100%;
		}
	}

	&[in-view="true"] > .settings-category-header {
		background-color: hsla(0deg, 0%, 20%, 20%);
	}

	.seventv-settings-category-contains-unseen {
		color: var(--seventv-accent);
	}

	.seventv-settings-category-icon {
		display: flex;
		align-items: center;
		margin: 0.5rem;
		height: 2rem;
		width: 2rem;
	}

	.dropdown-icon {
		display: flex;
		align-items: center;
		height: 3rem;
		width: 3rem;
		padding: 1rem;
		border-radius: 0.4rem;
		float: right;
		margin-left: auto;

		&:hover {
			background-color: hsla(0deg, 0%, 30%, 32%);
		}

		> svg {
			transition: transform 0.2s ease;
			transform: rotate(90deg);
		}
	}

	.seventv-settings-category-dropdown {
		height: 0;
		overflow: hidden;
		display: flex;
		flex-direction: column;

		.seventv-settings-subcategory {
			display: flex;
			cursor: pointer;
			height: 3rem;
			padding: 0.5rem 3rem;
			border-radius: 0.25rem;

			&:hover {
				background-color: hsla(0deg, 0%, 20%, 20%);
			}

			&.intersect {
				background-color: hsla(0deg, 0%, 30%, 32%);
			}
		}
	}

	&[open="true"] {
		.seventv-settings-category-dropdown {
			height: 100%;
		}

		.dropdown-icon {
			> svg {
				transform: rotate(180deg);
			}
		}
	}
}
</style>
