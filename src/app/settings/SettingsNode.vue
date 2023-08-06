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
				{{ te(node.label) ? t(node.label) : node.label }}
				<CloseIcon
					v-if="!!standard[node.type] && currentSetting !== node.defaultValue"
					class="reset-default"
					@click="resetSetting"
				/>
			</div>
			<div v-if="node.hint" class="subtitle">
				{{ te(node.hint) ? t(node.hint) : node.hint }}
			</div>
		</div>
		<div v-if="node.custom && node.custom.gridMode === 'new-row'" class="content">
			<component :is="node.custom.component" />
		</div>
		<div v-else class="seventv-settings-node-control">
			<component :is="com" :node="node" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useTimeoutFn } from "@vueuse/shared";
import { log } from "@/common/Logger";
import { db } from "@/db/idb";
import { useConfig } from "@/composable/useSettings";
import CloseIcon from "@/assets/svg/icons/CloseIcon.vue";
import FormCheckbox from "@/app/settings/control/FormCheckbox.vue";
import FormColor from "@/app/settings/control/FormColor.vue";
import FormDropdown from "@/app/settings/control/FormDropdown.vue";
import FormInput from "@/app/settings/control/FormInput.vue";
import FormSelect from "@/app/settings/control/FormSelect.vue";
import FormSlider from "@/app/settings/control/FormSlider.vue";
import FormToggle from "@/app/settings/control/FormToggle.vue";

const props = defineProps<{
	node: SevenTV.SettingNode<SevenTV.SettingType>;
	unseen?: boolean;
}>();

const emit = defineEmits<{
	(e: "seen"): void;
}>();

const { t, te } = useI18n();

function onHover(): void {
	if (!props.unseen) return;
	useTimeoutFn(() => emit("seen"), 500);
}

const currentSetting = useConfig<SevenTV.SettingType>(props.node.key);

// set the currentSetting back to default to trigger UI change before removing from the settings db
function resetSetting() {
	currentSetting.value = props.node.defaultValue;
	db.settings
		.delete(props.node.key)
		.catch((err) => log.error("failed to remove setting", props.node.key, "from db:", err));
}

const standard = {
	SELECT: FormSelect,
	DROPDOWN: FormDropdown,
	CHECKBOX: FormCheckbox,
	INPUT: FormInput,
	COLOR: FormColor,
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

	.seventv-settings-node-control {
		display: grid;
		justify-self: end;
		align-items: start;
		margin: 0.5rem 1rem;
		grid-area: control;
	}

	@media (width <= 60rem) {
		.subtitle,
		.seventv-settings-node-control,
		.content {
			display: none;
		}

		&:focus-within {
			grid-template-rows: 1fr 1fr 1fr;
			grid-template-rows: 1fr;

			.subtitle,
			.seventv-settings-node-control,
			.content {
				display: grid;
			}
		}
	}

	.reset-default {
		display: inline-block;
		margin-left: 0.5rem;
		color: var(--seventv-primary);
		width: 1rem;
		height: 1rem;
		cursor: pointer;

		&:hover {
			color: var(--seventv-warning);
		}
	}
}
</style>
