<template>
	<main class="seventv-settings-action-reasons">
		<div class="create-new">
			<FormInput label="New Reason..." :onkeydown="onNewReason" />
		</div>

		<UiScrollable>
			<div v-for="(reason, index) in reasons" :key="index" class="seventv-settings-action-reason-item">
				<div class="controls">
					<div class="control" @click="onReasonMove(index, 'up')">
						<ArrowIcon for="exit-icon" direction="up" />
					</div>
					<div class="control" @click="onReasonMove(index, 'down')">
						<ArrowIcon for="exit-icon" direction="down" />
					</div>
				</div>
				<div class="content">
					<div class="use-virtual-input" tabindex="0" @click="onInputFocus(index)">
						<span>{{ reason }}</span>
						<FormInput
							:model-value="reason"
							:ref="(n) => virtualInputs.set(index, n as InstanceType<typeof FormInput>)"
							@blur="onInputBlur(index)"
						/>
					</div>
					<div v-tooltip="'Remove'" class="control" @click="onReasonRemove(index)">
						<CloseIcon tabindex="0" />
					</div>
				</div>
			</div>
		</UiScrollable>
	</main>
</template>

<script setup lang="ts">
import { clamp } from "@vueuse/core";
import { useConfig } from "@/composable/useSettings";
import FormInput from "@/site/global/components/FormInput.vue";
import ArrowIcon from "@/assets/svg/icons/ArrowIcon.vue";
import CloseIcon from "@/assets/svg/icons/CloseIcon.vue";
import UiScrollable from "@/ui/UiScrollable.vue";

const reasons = useConfig<string[]>("chat.mod_action_reasons.list");

const virtualInputs = new Map<number, InstanceType<typeof FormInput>>();

function onNewReason(event: KeyboardEvent) {
	if (event.target instanceof HTMLInputElement === false) return;
	if (event.target.value.length === 0) return;

	if (event.key !== "Enter") return;

	reasons.value = [...reasons.value, event.target.value];
	event.target.value = "";
}

function onReasonRemove(index: number) {
	reasons.value.splice(index, 1);
	reasons.value = [...reasons.value];
}

function onReasonMove(index: number, direction: "up" | "down") {
	const newIndex = clamp(direction === "up" ? index - 1 : index + 1, 0, reasons.value.length);

	const [reason] = reasons.value.splice(index, 1);
	reasons.value.splice(newIndex, 0, reason);
	reasons.value = [...reasons.value];
}

function onInputFocus(index: number) {
	const input = virtualInputs.get(index);

	input?.focus();
}

function onInputBlur(index: number) {
	const input = virtualInputs.get(index);

	if (!input) return;

	const value = input.value();

	// if the input is now empty, we shall delete the reason
	if (!value || value.length === 0) {
		reasons.value.splice(index, 1);
	} else {
		reasons.value.splice(index, 1, value);
	}

	reasons.value = [...reasons.value];
}
</script>

<style scoped lang="scss">
.seventv-settings-action-reasons {
	display: grid;
	grid-template-rows: min-content 1fr;
	max-height: 35vh;
	gap: 1rem;

	.create-new {
		display: flex;
		flex-direction: row;

		input {
			width: 100%;
		}
	}
}

.control {
	display: flex;
	justify-content: center;
	align-items: center;
	width: 3rem;
	height: 3rem;

	&:hover {
		background: hsla(0deg, 0%, 30%, 32%);
		border-radius: 0.25rem;
		cursor: pointer;
	}
}

.seventv-settings-action-reason-item {
	display: flex;
	flex-direction: row;
	padding: 0.5rem;
	width: 100%;
	align-items: center;
	gap: 1rem;

	&:hover,
	&:focus-within {
		background-color: #3333;
	}

	&:nth-child(odd) {
		background-color: var(--seventv-background-shade-2);
	}

	.controls {
		display: flex;
		justify-content: center;
		color: var(--seventv-input-border);
	}

	.content {
		display: grid;
		grid-template-columns: 1fr min-content;
		align-items: center;
		width: 100%;
		gap: 1rem;
		height: 3.5rem;
	}

	.use-virtual-input {
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
}
</style>
