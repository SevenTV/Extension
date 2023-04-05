<template>
	<div
		:data-key="node.key"
		class="seventv-settings-node"
		tabindex="0"
		:disabled="node.disabledIf?.()"
		:grid-mode="node.custom?.gridMode"
		@mouseover="onHover"
	>
		<div class="label">
			<div class="title" :class="{ unseen }">
				{{ node.label }}
			</div>
			<div v-if="node.hint" class="subtitle">
				{{ node.hint }}
			</div>
		</div>
		<div v-if="node.custom && node.custom.gridMode === 'new-row'" class="content">
			<component :is="node.custom.component" />
		</div>
		<div v-else class="control">
			<component :is="com" :node="node" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { useTimeoutFn } from "@vueuse/shared";
import FormCheckbox from "@/site/global/settings/control/FormCheckbox.vue";
import FormDropdown from "@/site/global/settings/control/FormDropdown.vue";
import FormInput from "@/site/global/settings/control/FormInput.vue";
import FormSelect from "@/site/global/settings/control/FormSelect.vue";
import FormSlider from "@/site/global/settings/control/FormSlider.vue";
import FormToggle from "@/site/global/settings/control/FormToggle.vue";

const props = defineProps<{
	node: SevenTV.SettingNode<SevenTV.SettingType>;
	unseen?: boolean;
}>();

const emit = defineEmits<{
	(e: "seen"): void;
}>();

function onHover(): void {
	if (!props.unseen) return;
	useTimeoutFn(() => emit("seen"), 500);
}

const standard = {
	SELECT: FormSelect,
	DROPDOWN: FormDropdown,
	CHECKBOX: FormCheckbox,
	INPUT: FormInput,
	TOGGLE: FormToggle,
	SLIDER: FormSlider,
	CUSTOM: undefined,
	NONE: undefined,
};

const com = standard[props.node.type] ?? props.node.custom?.component;
</script>

<style scoped lang="scss">
.seventv-settings-node {
	display: grid;
	grid-template-columns: 1fr auto;
	grid-template-rows: 1fr auto;
	grid-auto-flow: row;
	grid-template-areas:
		"label control"
		"content content";
	row-gap: 1rem;
	padding: 0.25rem 0;

	transition: background-color 90ms ease-out;
	&:hover {
		background-color: hsla(0deg, 0%, 0%, 10%);
	}

	&[disabled="true"] {
		opacity: 0.35;
		pointer-events: none;
	}

	.label {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: 1fr auto;
		grid-template-areas:
			"title"
			"subtitle";
		grid-area: label;
		margin: 0 1rem;
		gap: 0.5rem;
	}

	.title {
		grid-area: title;
		font-size: 1.35rem;
		font-weight: 800;
		flex-shrink: 0;

		&.unseen::after {
			content: "";
			display: inline-block;
			margin-left: 0.5rem;
			width: 0.75rem;
			height: 0.75rem;
			background-color: var(--seventv-accent);
			clip-path: circle(50% at 50% 50%);
		}
	}

	.subtitle {
		grid-area: subtitle;
		color: var(--seventv-text-color-secondary);
		padding: 0.5rem;
		margin: -0.5rem;
		width: 100%;
	}

	.content {
		display: grid;
		grid-auto-columns: 1fr;
		grid-area: content;
		margin: 0 1rem;
	}

	.control {
		display: grid;
		justify-self: end;
		align-items: start;
		margin: 0.5rem 1rem;
		grid-area: control;
		position: unset;
	}

	@media (max-width: 60rem) {
		.subtitle,
		.control,
		.content {
			display: none;
		}

		&:focus-within {
			grid-template-rows: 1fr 1fr 1fr;
			grid-template-rows: 1fr;
			.subtitle,
			.control,
			.content {
				display: grid;
			}
		}
	}
}
</style>
