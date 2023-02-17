<template>
	<div class="settings-node" tabindex="0" :disabled="node.disabledIf?.()">
		<div class="wrapper">
			<div class="setting-items">
				<div class="label">
					<span class="label-text">
						{{ node.label }}
					</span>
					<div class="label-hint" :tooltip="node.hint">ⓘ</div>
				</div>
				<div class="component-container">
					<component :is="getComponent(node)" :node="node" />
				</div>
			</div>
		</div>
		<div v-if="node.hint" class="hint">
			{{ node.hint }}
		</div>
	</div>
</template>

<script setup lang="ts">
import FormCheckbox from "@/site/global/components/FormCheckbox.vue";
import FormDropdown from "@/site/global/components/FormDropdown.vue";
import FormInput from "@/site/global/components/FormInput.vue";
import FormSelect from "@/site/global/components/FormSelect.vue";
import FormSlider from "@/site/global/components/FormSlider.vue";
import FormToggle from "@/site/global/components/FormToggle.vue";

defineProps<{
	node: SevenTV.SettingNode<SevenTV.SettingType>;
}>();

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

function getComponent(node: SevenTV.SettingNode<SevenTV.SettingType>) {
	return standard[node.type] ?? node.component;
}
</script>

<style scoped lang="scss">
.settings-node {
	position: relative;
	padding: 1rem;

	.wrapper {
		transition: transform 0.2s ease-out;
	}

	.setting-items {
		display: flex;
		justify-content: space-between;
	}

	&:hover {
		border-radius: 0.4rem;
		background: hsla(0deg, 0%, 60%, 16%);
		background-size: 100% 25rem;
	}

	&[disabled="true"] {
		opacity: 0.35;
		pointer-events: none;
	}
}

.label {
	display: flex;
	justify-content: space-between;
	font-size: 1.4rem;
	font-weight: 600;
	flex-shrink: 0;
	width: 23rem;

	.label-hint {
		display: none;
		color: hsla(0deg, 0%, 50%, 90%);
		padding: 0.5rem;
		margin: -0.5rem;

		&:hover:after {
			content: attr(tooltip);
			position: absolute;
			inset: 100% auto auto 0;
			border: 1px solid var(--seventv-border-transparent-1);
			background: var(--seventv-background-transparent-1);
			@at-root .seventv-transparent & {
				backdrop-filter: blur(2em);
			}
			font-size: 1.2rem;
			font-weight: 400;
			padding: 1rem;

			border-radius: 0.4rem;
			z-index: 999;
			max-width: 23rem;
			box-shadow: 1px 0 1px hsla(0deg, 0%, 20%, 32%);
		}
	}
}

.component-container {
	flex-shrink: 0;
	max-width: 23rem;
}

.hint {
	margin-top: 1rem;
	font-size: 1.2rem;
	font-weight: 400;
	color: hsla(0deg, 0%, 50%, 90%);
}

@media (max-width: 60rem) {
	.settings-node {
		cursor: pointer;

		.wrapper {
			width: 50rem;
			.label-text {
				margin-right: auto;
			}

			.label-hint {
				display: unset;
			}
		}
		&:focus-within {
			.wrapper {
				transform: translateX(-27rem);
				cursor: auto !important;
			}
		}
	}
	.hint {
		display: none;
	}
}
</style>
