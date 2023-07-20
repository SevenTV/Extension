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

			<UiScrollable>
				<template v-for="(h, _, index) of highlights.getAll()" :key="h.id">
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
							<FormCheckbox
								:checked="!!h.caseSensitive"
								@update:checked="onCaseSensitiveChange(h, $event)"
							/>
						</div>

						<div name="color">
							<input v-model="h.color" type="color" @input="onColorChange(h, $event as InputEvent)" />
						</div>

						<div ref="interactRef" name="interact">
							<button
								ref="soundEffectButton"
								class="sound-button"
								:class="{ 'has-sound': !!h.soundFile }"
								tabindex="0"
							>
								<CompactDiscIcon v-tooltip="'Set Custom Sound'" />
								<div class="sound-options">
									<UiFloating v-if="interactRef?.[index]" :anchor="interactRef[index]">
										<button :active="!h.soundPath && !h.soundFile" @click="onRemoveSound(h)">
											No Sound
										</button>
										<button :active="!!h.soundPath && !h.soundFile" @click="onUseDefaultSound(h)">
											Default Sound
										</button>
										<button :active="!!h.soundFile">
											<label>
												Custom Sound{{ h.soundFile ? "" : "..." }}
												<p v-if="h.soundFile">{{ h.soundFile.name }}</p>
												<input
													type="file"
													accept="audio/midi, audio/mpeg, audio/ogg, audio/wav, audio/webm, audio/vorbis, audio/ogg"
													@input="onUploadSoundFile(h, $event)"
												/>
											</label>
										</button>
									</UiFloating>
								</div>
							</button>

							<CloseIcon v-tooltip="'Remove'" tabindex="0" @click="onDeleteHighlight(h)" />
						</div>
					</div>
				</template>
			</UiScrollable>

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
import FormCheckbox from "@/site/global/components/FormCheckbox.vue";
import FormInput from "@/site/global/components/FormInput.vue";
import CloseIcon from "@/assets/svg/icons/CloseIcon.vue";
import CompactDiscIcon from "@/assets/svg/icons/CompactDiscIcon.vue";
import UiFloating from "@/ui/UiFloating.vue";
import UiScrollable from "@/ui/UiScrollable.vue";
import { v4 as uuid } from "uuid";

const ctx = useChannelContext(); // this will be an empty context, as config is not tied to channel
const highlights = useChatHighlights(ctx);

const newInput = ref("");
const inputs = reactive({
	pattern: new WeakMap<HighlightDef, InstanceType<typeof FormInput>>(),
	label: new WeakMap<HighlightDef, InstanceType<typeof FormInput>>(),
});
const interactRef = ref<HTMLElement[]>();

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
	h.flashTitle = checked;
	highlights.updateFlashTitle(h);
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

function onColorChange(h: HighlightDef, ev: InputEvent): void {
	if (!(ev.target instanceof HTMLInputElement)) return;
	const color = ev.target.value;

	h.color = color;
	highlights.save();
}

function onUploadSoundFile(h: HighlightDef, ev: Event): void {
	if (!(ev.target instanceof HTMLInputElement)) return;
	const file = ev.target.files?.[0];
	if (!file) return;

	const reader = new FileReader();
	reader.onload = (ev) => {
		if (!(ev.target instanceof FileReader)) return;
		const data = ev.target.result;
		if (!(data instanceof ArrayBuffer)) return;
		// file can't be more than 50KB (sanity value to avoid saturating IndexedDB)
		if (data.byteLength > 50 * 1024) return alert("File is too large! (max 50KB)");

		delete h.soundPath;
		h.soundFile = {
			name: file.name,
			type: file.type,
			data,
		};

		highlights.updateSoundData(h);
		highlights.save();
	};

	ev.target.value = "";
	reader.readAsArrayBuffer(file);
}

function onUseDefaultSound(h: HighlightDef): void {
	delete h.soundFile;
	delete h.soundDef;
	h.soundPath = "#ping";

	highlights.save();
}

function onRemoveSound(h: HighlightDef): void {
	delete h.soundFile;
	delete h.soundPath;
	delete h.soundDef;

	highlights.updateSoundData(h);
	highlights.save();
}

function onDeleteHighlight(h: HighlightDef): void {
	highlights.remove(h.id);
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
		max-height: 36rem;

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

			[name="color"] > input {
				&::-webkit-color-swatch-wrapper {
					padding: 0;
				}

				&::-webkit-color-swatch {
					border: none;
				}
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
