<template>
	<main class="seventv-settings-custom-highlights">
		<div class="tabs"></div>
		<div class="list">
			<div class="item heading">
				<div>Pattern</div>
				<div>Label</div>
				<div class="centered">Flash Title</div>
				<div class="centered">RegExp</div>
				<div>Case Sensitive</div>
				<div>Color</div>
			</div>

			<template v-for="h of highlights.getAll()" :key="h.id">
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

					<!-- Checkbox: Flash Title -->
					<div name="flash-title" class="centered">
						<FormCheckbox :checked="!!h.flashTitle" @update:checked="onFlashTitleChange(h, $event)" />
					</div>

					<!-- Checkbox: RegExp -->
					<div name="is-regexp" class="centered">
						<FormCheckbox :checked="!!h.regexp" @update:checked="onRegExpStateChange(h, $event)" />
					</div>

					<!-- Checkbox: Case Sensitive -->
					<div name="case-sensitive" class="centered">
						<FormCheckbox :checked="!!h.caseSensitive" @update:checked="onCaseSensitiveChange(h, $event)" />
					</div>

					<div name="color">
						<input v-model="h.color" type="color" />
					</div>

					<div name="interact">
						<CloseIcon v-tooltip="'Remove'" @click="onDeleteHighlight(h)" />
					</div>
				</div>
			</template>

			<!-- New -->
			<div class="item create-new">
				<div name="pattern">
					<FormInput v-model="newInput" label="New Highlight..."> hi </FormInput>
				</div>
			</div>
		</div>
	</main>
</template>

<script setup lang="ts">
import { nextTick, reactive, ref, watch } from "vue";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { HighlightDef, useChatHighlights } from "@/composable/chat/useChatHighlights";
import CloseIcon from "@/assets/svg/icons/CloseIcon.vue";
import FormCheckbox from "../components/FormCheckbox.vue";
import FormInput from "../components/FormInput.vue";
import { v4 as uuid } from "uuid";

void 0;

const ctx = useChannelContext(); // this will be an empty context, as config is not tied to channel
const highlights = useChatHighlights(ctx);

const newInput = ref("");
const inputs = reactive({
	pattern: new WeakMap<HighlightDef, InstanceType<typeof FormInput>>(),
	label: new WeakMap<HighlightDef, InstanceType<typeof FormInput>>(),
});

function onInputFocus(h: HighlightDef, inputName: keyof typeof inputs): void {
	const input = inputs[inputName].get(h);
	if (!input) return;

	input.focus();
}

function onInputBlur(h: HighlightDef, inputName: keyof typeof inputs): void {
	const input = inputs[inputName].get(h);
	if (!input) return;

	const id = uuid();
	highlights.updateId("new-highlight", id);
	highlights.save();
}

function onFlashTitleChange(h: HighlightDef, checked: boolean): void {
	h.flashTitle = checked ? () => ` 💬 Highlight: ${h.label}` : undefined;
	highlights.save();
}

function onRegExpStateChange(h: HighlightDef, checked: boolean): void {
	h.regexp = checked;
	highlights.save();
}

function onCaseSensitiveChange(h: HighlightDef, checked: boolean): void {
	h.caseSensitive = checked;
	highlights.save();
}

function onDeleteHighlight(h: HighlightDef): void {
	highlights.remove(h);
	highlights.save();
}

// Watch for user writing to "new highlight" input
// If they do, we create a new highlight and switch focus
watch(newInput, (val, old) => {
	if (!val || old) return;

	const h = highlights.define(
		"new-highlight",
		{
			color: "#8803fc",
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
main.seventv-settings-custom-highlights {
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

		.item {
			display: grid;
			grid-auto-flow: row dense;
			grid-template-columns: 20% 9rem 1fr 1fr 1fr 1fr 1fr;
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
				justify-self: end;

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
