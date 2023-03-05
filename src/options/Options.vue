<template>
	<main class="seventv-options">
		<div class="general-heading">
			<div class="app-title">
				<Logo7TV />
				<h1>7tv.app</h1>
			</div>
		</div>

		<RouterView />
	</main>

	<Tooltip />
</template>

<script setup lang="ts">
import Tooltip from "@/site/global/Tooltip.vue";
import Logo7TV from "@/assets/svg/logos/Logo7TV.vue";

document.body.setAttribute("theme", "dark");
</script>

<style lang="scss">
@import "@/assets/style/global.scss";

html {
	box-sizing: border-box;
	font-family: Roboto, sans-serif;
	height: 100%;
	width: 100%;
}

body {
	height: 100%;
	width: 100%;
	overflow-x: hidden;

	background: var(--seventv-background-shade-1);
	color: var(--seventv-text-color-normal);
}

a {
	all: unset;
}

#app {
	height: 100%;
	width: 100%;
}

*,
*:before,
*:after {
	box-sizing: inherit;
	margin: 0;
}

.seventv-options {
	display: flex;
	flex-direction: column;
	height: 100%;
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
