<template>
	<div class="seventv-settings-category" :open="open">
		<div tabindex="0" class="settings-category-header" @click="onCategoryClick()">
			<div class="seventv-settings-category-icon">
				<IconForSettings :name="category" />
			</div>
			<span class="seventv-settings-expanded">
				{{ category }}
			</span>
			<div v-if="Object.keys(subs).filter((s) => s).length" class="dropdown-icon seventv-settings-expanded">
				<DropdownIcon />
			</div>
		</div>
		<div class="seventv-settings-category-dropdown seventv-settings-expanded">
			<template v-for="s of Object.keys(subs)" :key="s">
				<div v-if="s" class="seventv-settings-subcategory" @click="emit('open-subcategory', s)">
					{{ s }}
				</div>
			</template>
		</div>
	</div>
</template>
<script setup lang="ts">
import { ref } from "vue";
import DropdownIcon from "@/assets/svg/icons/DropdownIcon.vue";
import IconForSettings from "@/assets/svg/icons/IconForSettings.vue";

defineProps<{
	category: string;
	subs: Record<string, SevenTV.SettingNode[]>;
}>();

const emit = defineEmits<{
	(event: "open-category"): void;
	(event: "open-subcategory", subcategory: string): void;
}>();

const open = ref(false);

function onCategoryClick(): void {
	if (!(open.value = !open.value)) return;

	emit("open-category");
}
</script>
<style scoped lang="scss">
.seventv-settings-category {
	background-color: hsla(0deg, 0%, 30%, 6%);
	border-radius: 0.4rem;
	margin: 0.5rem;

	.settings-category-header {
		display: flex;
		cursor: pointer;
		border-radius: 0.4rem;
		height: 4rem;
		padding: 0.5rem;
		column-gap: 0.5rem;
		align-items: center;
		font-weight: 600;
		font-size: 1.6rem;

		&:hover,
		&:focus-within {
			background-color: hsla(0deg, 0%, 30%, 32%);
		}

		svg {
			height: 100%;
			width: 100%;
		}
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
			margin: 0.2rem 0.5rem 0.2rem 3.5rem;
			padding: 0.5rem;
			border-radius: 0.4rem;
			&:hover {
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
