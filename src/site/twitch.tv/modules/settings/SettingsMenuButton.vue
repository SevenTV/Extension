<template>
	<Teleport :to="containerEl">
		<div class="seventv-menu-button">
			<button class="seventv-settings-button" @click="emit('toggle')">
				<Logo7TV class="logo" />
			</button>
			<span :class="`tooltip-${tooltip}`"> 7TV Settings </span>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Logo7TV from "@/assets/svg/logos/Logo7TV.vue";

const emit = defineEmits<{
	(event: "toggle"): void;
}>();

const el = document.createElement("div");
el.id = "seventv-settings-button";
const containerEl = ref<HTMLElement>(el);

// Topnav on the main twitch page
let menuButtons = document.querySelector(".top-nav__menu")?.lastChild;
let tooltip = "under";

if (!menuButtons) {
	// Sidenav in modview
	menuButtons = document.querySelector(".modview-dock__followed-channels")?.nextSibling;
	tooltip = "right";
}
if (!menuButtons) {
	// Header if popout
	menuButtons = document.querySelector(".stream-chat-header")?.lastChild;
	tooltip = "left";
}
if (menuButtons) {
	menuButtons.insertBefore(containerEl.value, menuButtons.lastChild);
}
</script>
<style scoped lang="scss">
.top-nav {
	.seventv-menu-button {
		margin: 0.5rem;
		> span {
			transition: opacity 0.1s ease-in 0.2s;
		}
	}
}

.modview-dock__drop-zone {
	.seventv-menu-button {
		margin: 0 0.5rem 1rem;
		> span {
			transition: opacity 0.1s ease-in 0.2s;
		}
	}
}
.seventv-menu-button {
	cursor: pointer;
	display: flex;
	justify-content: center;
	width: 3rem;
	height: 3rem;
	position: relative;

	%tooltip {
		background-color: var(--color-text-base);
		color: var(--color-text-tooltip);
		text-align: center;
		padding: 0.2rem 0;
		border-radius: 0.4rem;
		display: flex;
		font-weight: 600;
		height: 2.6rem;
		margin-top: -1.3rem;
		align-items: center;
		justify-content: center;

		position: absolute;
		width: 7em;

		margin-left: -3.5em;
		z-index: 9999;

		visibility: hidden;
		opacity: 0;

		&:after {
			content: "";
			position: absolute;
			margin: -0.4rem -0.5rem -0.5rem -0.4rem;
			border-width: 0.4rem;
			transform: rotate(45deg);
			border-radius: 0.2rem;
			border-color: var(--color-text-base);
			border-style: solid;
			pointer-events: none;
		}
	}

	.tooltip-under {
		@extend %tooltip;
		top: 170%;
		left: 50%;

		&:after {
			bottom: 100%;
			left: 50%;
		}
	}

	.tooltip-over {
		@extend %tooltip;
		bottom: 170%;
		left: 50%;

		&:after {
			top: 100%;
			left: 50%;
		}
	}
	.tooltip-left {
		@extend %tooltip;
		right: 135%;
		top: 50%;

		&:after {
			left: 100%;
			top: 50%;
		}
	}
	.tooltip-right {
		@extend %tooltip;
		left: 290%;
		top: 50%;

		&:after {
			right: 100%;
			top: 50%;
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
