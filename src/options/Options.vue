<template>
	<main class="seventv-options" :class="{ 'no-header': noHeader }">
		<div class="general-heading">
			<div class="app-title">
				<Logo7TV />
			</div>
		</div>

		<RouterView />
	</main>

	<Tooltip />
</template>

<script setup lang="ts">
import { provide, ref, watch } from "vue";
import { useRoute } from "vue-router";
import Tooltip from "@/site/global/Tooltip.vue";
import Logo7TV from "@/assets/svg/logos/Logo7TV.vue";
import { OPTIONS_CONTEXT_KEY } from "./keys";

provide(OPTIONS_CONTEXT_KEY, true);

const route = useRoute();
const noHeader = ref(false);

watch(
	route,
	() => {
		noHeader.value = route.query.noheader === "1";
	},
	{ immediate: true },
);

document.body.setAttribute("theme", "dark");
</script>

<style lang="scss">
@import "@/assets/style/global.scss";

html[data-seventv-app] {
	box-sizing: border-box;
	font-family: Roboto, sans-serif;
	height: 100%;
	width: 100%;

	*,
	*:before,
	*:after {
		box-sizing: inherit;
		margin: 0;
	}
}

body[data-seventv-app] {
	height: 100%;
	width: 100%;
	overflow-x: hidden;
}

#app {
	height: 100%;
	width: 100%;
}

.seventv-options {
	display: flex;
	flex-direction: column;
	height: 100%;
	background: var(--seventv-background-shade-1);
	color: var(--seventv-text-color-normal);

	&.no-header {
		background: none;

		.general-heading {
			display: none;
		}
	}
}

.general-heading {
	display: grid;
	grid-template-columns: 50% 50%;
	padding: 0.5rem;
	background: var(--seventv-background-shade-2);

	.app-title {
		font-size: 1vw;
		display: flex;
		align-items: center;
		gap: 0.5rem;

		svg {
			font-size: 2rem;
			font-size: 2vw;
			margin-right: 0.15rem;
		}
	}
}
</style>
