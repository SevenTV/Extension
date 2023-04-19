<template>
	<main class="seventv-settings-custom-ignores">
		<div class="tabs"></div>
		<div class="list">
			<div class="item heading">
				<div>Pattern</div>
				<div>Label</div>
				<div class="centered">RegExp</div>
				<div>Case Sensitive</div>
			</div>

			<UiScrollable>
				<template v-for="h of ignores.getAllIgnored()" :key="h.id">
					<div class="item">
						<!-- Pattern -->
						<div name="pattern" class="use-virtual-input" tabindex="0" @click="onInputFocus(h, 'pattern')">
							<span>{{ h.pattern }}</span>
							<FormInput
								:ref="(c) => inputs.pattern.set(h, c as InstanceType<typeof FormInput>)"
								v-model="h.pattern"
								@blur="onInputBlur(h, 'pattern')"
							/>
						</div>

						<!-- Label -->
						<div name="label" class="use-virtual-input" tabindex="0" @click="onInputFocus(h, 'label')">
							<span>{{ h.label }}</span>
							<FormInput
								:ref="(c) => inputs.label.set(h, c as InstanceType<typeof FormInput>)"
								v-model="h.label"
								@blur="onInputBlur(h, 'label')"
							/>
						</div>

						<!-- Checkbox: RegExp -->
						<div name="is-regexp" class="centered">
							<FormCheckbox :checked="!!h.regexp" @update:checked="onRegExpStateChange(h, $event)" />
						</div>

						<!-- Checkbox: Case Sensitive -->
						<div name="case-sensitive" class="centered">
							<FormCheckbox
								:checked="!!h.caseSensitive"
								@update:checked="onCaseSensitiveChange(h, $event)"
							/>
						</div>

						<div ref="interactRef" name="interact">
							<CloseIcon v-tooltip="'Remove'" tabindex="0" @click="onDeleteIgnore(h)" />
						</div>
					</div>
				</template>
			</UiScrollable>

			<!-- New -->
			<div class="item create-new">
				<div name="pattern">
					<FormInput v-model="newInput" label="New Ignore..."> hi </FormInput>
				</div>
			</div>
		</div>
	</main>
</template>

<script setup lang="ts">
import { nextTick, reactive, ref, watch } from "vue";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { IgnoreDef, useChatHighlights } from "@/composable/chat/useChatHighlights";
import CloseIcon from "@/assets/svg/icons/CloseIcon.vue";
import UiScrollable from "@/ui/UiScrollable.vue";
import FormCheckbox from "../components/FormCheckbox.vue";
import FormInput from "../components/FormInput.vue";
import { v4 as uuid } from "uuid";

const ctx = useChannelContext(); // this will be an empty context, as config is not tied to channel
const ignores = useChatHighlights(ctx, true);

const newInput = ref("");
const inputs = reactive({
	pattern: new WeakMap<IgnoreDef, InstanceType<typeof FormInput>>(),
	label: new WeakMap<IgnoreDef, InstanceType<typeof FormInput>>(),
});
const interactRef = ref<HTMLElement[]>();

function onInputFocus(h: IgnoreDef, inputName: keyof typeof inputs): void {
	const input = inputs[inputName].get(h);
	if (!input) return;

	input.focus();
}

function onInputBlur(h: IgnoreDef, inputName: keyof typeof inputs): void {
	const input = inputs[inputName].get(h);
	if (!input) return;

	const id = uuid();
	ignores.updateId("new-ignore", id);
	ignores.save();
}

function onRegExpStateChange(h: IgnoreDef, checked: boolean): void {
	h.regexp = checked;
	ignores.save();
}

function onCaseSensitiveChange(h: IgnoreDef, checked: boolean): void {
	h.caseSensitive = checked;
	ignores.save();
}

function onDeleteIgnore(h: IgnoreDef): void {
	ignores.remove(h.id);
	ignores.save();
}

// Watch for user writing to "new ignore" input
// If they do, we create a new ignore and switch focus
watch(newInput, (val, old) => {
	if (!val || old) return;

	const h = ignores.defineIgnore(
		"new-ignore",
		{
			label: "",
			pattern: val,
		},
		true,
	);

	nextTick(() => {
		const input = inputs.pattern.get(h);
		if (!input) return;

		input.focus();
		newInput.value = "";
	});
});
</script>

<style scoped lang="scss">
main.seventv-settings-custom-ignores {
	display: grid;
	padding: 0.25rem;
	grid-template-rows: 0 max-content;
	grid-template-areas:
		"tabs"
		"list";

	overflow-x: auto;

	.tabs {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		grid-template-rows: 1fr;
		grid-area: tabs;
	}

	.list {
		display: grid;
		grid-area: list;
		max-height: 36rem;

		.item {
			display: grid;
			grid-auto-flow: row dense;
			grid-template-columns: 20% 9rem repeat(3, 1fr);
			column-gap: 3rem;
			padding: 1rem;

			> div {
				align-self: center;

				&.centered {
					justify-self: center;
				}
			}

			&:nth-child(odd) {
				background-color: var(--seventv-background-shade-2);
			}

			&.heading {
				background-color: var(--seventv-background-shade-3);
				border-bottom: 0.25rem solid var(--seventv-primary);
			}

			&:not(.create-new) > .use-virtual-input {
				cursor: text;
				padding: 0.5rem;
				display: block;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;

				input {
					width: 0;
					height: 0;
					opacity: 0;
				}

				&:focus-within {
					padding: 0;

					span {
						display: none;
					}

					input {
						opacity: 1;
						width: 100%;
						height: initial;
					}
				}
			}

			[name="color"] > input {
				&::-webkit-color-swatch-wrapper {
					padding: 0;
				}

				&::-webkit-color-swatch {
					border: none;
				}
			}

			[name="interact"] {
				display: grid;
				column-gap: 1rem;
				grid-auto-flow: column;
				justify-self: end;

				button {
					all: unset;
					cursor: pointer;
				}

				.sound-options {
					display: none;
				}

				.sound-button.has-sound::after {
					content: "";
					position: absolute;
					width: 0.75rem;
					height: 0.75rem;
					margin-left: -0.25rem;
					margin-top: -0.25rem;
					background-color: var(--seventv-accent);
					border-radius: 50%;
				}

				.sound-button:focus-within > .sound-options {
					position: fixed;
					width: 9rem;
					display: block;
					z-index: 10000;

					input {
						display: none;
					}

					label {
						cursor: pointer;
					}

					button {
						width: 100%;
						padding: 0.5rem;
						background-color: var(--seventv-background-shade-2);
						border: 0.25rem solid var(--seventv-background-shade-3);
						transition: border-color 90ms ease-in-out;

						p {
							color: var(--seventv-muted);
						}

						&:hover {
							border-color: var(--seventv-primary);
						}

						&[active="true"] {
							color: var(--seventv-primary);
						}
					}
				}

				svg {
					cursor: pointer;
					font-size: 2rem;

					&:hover {
						color: var(--seventv-primary);
					}
				}
			}
		}
	}
}
</style>
