<template>
	<Teleport :to="containerEl">
		<div class="seventv-menu-button">
			<button class="seventv-settings-button" @click="emit('toggle')">
				<Logo7TV class="logo" />
			</button>
			<span class="tooltip-under"> 7TV Settings </span>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Logo7TV from "@/assets/svg/Logo7TV.vue";

const emit = defineEmits<{
	(event: "toggle"): void;
}>();

const el = document.createElement("div");
el.id = "seventv-settings-button";
const containerEl = ref<HTMLElement>(el);

const menuButtons = document.querySelector(".top-nav__menu")?.lastChild ?? undefined;
if (menuButtons) {
	menuButtons.insertBefore(containerEl.value, menuButtons.lastChild);
}
</script>
<style scoped lang="scss">
.seventv-menu-button {
	cursor: pointer;
	display: flex;
	justify-content: center;
	width: 3rem;
	height: 3rem;
	margin: 0.5rem;
	position: relative;

	%tooltip {
		background-color: var(--color-text-base);
		color: var(--color-text-tooltip);
		text-align: center;
		padding: 2px 0;
		border-radius: 4px;
		font-weight: 600;

		position: absolute;
		width: 7em;
		left: 50%;
		margin-left: -3.5em;
		z-index: 9999;

		visibility: hidden;
		opacity: 0;
		transition: opacity 0.1s ease-in 0.2s;

		&:after {
			content: "";
			position: absolute;
			left: 50%;
			margin-left: -5px;
			border-width: 5px;
			border-style: solid;
			pointer-events: none;
		}
	}

	.tooltip-under {
		@extend %tooltip;
		top: 135%;

		&:after {
			bottom: 100%;
			border-color: transparent transparent var(--color-text-base) transparent;
		}
	}

	.tooltip-over {
		@extend %tooltip;
		bottom: 135%;

		&:after {
			top: 100%;
			border-color: var(--color-text-base) transparent transparent transparent;
		}
	}

	&:hover {
		border-radius: 0.4rem;
		background-color: var(--color-background-button-text-hover);
		color: var(--color-fill-button-icon-hover);

		%tooltip {
			visibility: visible;
			opacity: 1;
		}
	}

	button {
		border: 0;
		background: transparent;
		width: var(--button-size-default);
		height: var(--button-size-default);
		padding: 0.5rem;

		&:hover {
			color: var(--color-fill-button-icon-hover);
		}
	}

	.logo {
		width: 100%;
		height: 100%;
	}
}
</style>
