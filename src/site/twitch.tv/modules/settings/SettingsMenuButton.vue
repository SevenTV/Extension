<template>
	<Teleport :to="containerEl">
		<div class="seventv-tw-button seventv-menu-button">
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
@import "@/assets/style/tw-tooltip.scss";

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
	.logo {
		width: 100%;
		height: 100%;
	}
}
</style>
