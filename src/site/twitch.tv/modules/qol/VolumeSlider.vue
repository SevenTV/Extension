<template>
	<div class="volume-menu">
		<h4 class="header">Emote Volume</h4>
		<div class="volume-slider">
			<input
				v-model.number="volume"
				type="range"
				:min="0"
				:max="1"
				:step="0.01"
				:held="active"
				@mousedown="active = true"
				@mouseup="active = false"
			/>
		</div>
		<button
			v-tooltip="'Completely disables feature and related UI\n\n(Can be re-enabled in settings)'"
			class="disable-button"
			@click="disable()"
		>
			Disable
		</button>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useConfig } from "@/composable/useSettings";

const enabled = useConfig<boolean>("tomfoolery_2023.enabled");
const volume = useConfig<number>("tomfoolery_2023.volume");

const active = ref(false);

function disable() {
	enabled.value = false;
}
</script>

<style lang="scss" scoped>
.volume-menu {
	padding: 0.5em;
	border-radius: 0.33em;
	color: #fff;
	background-color: rgba(0, 0, 0, 50%);
	outline: 0.1rem solid var(--seventv-muted);

	:not(:last-child) {
		margin-bottom: 2rem;
	}

	@at-root .seventv-transparent & {
		backdrop-filter: blur(0.5em);
	}
}

.disable-button {
	background-color: var(--seventv-input-background);
	padding: 0.5rem 1rem;
	border-radius: 0.25rem;
	border: 0.01rem solid var(--seventv-input-border);
	color: var(--seventv-text-color-normal);
}

.volume-slider {
	height: 0.75rem;
	width: 100%;
	background: white;
	align-items: center;
	border-radius: 999rem;
	display: inline-flex;

	> input {
		width: 100%;

		-webkit-appearance: none;
		appearance: none;
		background: transparent;
		cursor: pointer;

		&[held="true"] {
			&::-webkit-slider-thumb {
				transform: scale(1.15);
			}
			&::-moz-range-thumb {
				transform: scale(1.15);
			}
		}
	}

	@mixin thumb {
		transition: transform 70ms ease;
		appearance: none;
		background-color: white;
		clip-path: circle(1rem at center);
		border-radius: 999rem;
		height: 2rem;
		width: 2rem;
		z-index: 100;

		&:hover {
			cursor: pointer;
		}
	}

	> input::-webkit-slider-thumb {
		@include thumb;
	}
	> input::-moz-range-thumb {
		@include thumb;
	}

	> input::-webkit-slider-runnable-track {
		appearance: none;
		cursor: pointer;
	}
	> input::-moz-range-track {
		appearance: none;
		cursor: pointer;
	}
}
</style>
