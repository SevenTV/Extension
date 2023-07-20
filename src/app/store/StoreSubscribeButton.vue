<template>
	<UiButton class="seventv-button-subscribe" @click="openStorePage">
		<Logo7TV />
		<span v-t="'onboarding.promo_subscribe'" />
	</UiButton>
</template>

<script setup lang="ts">
import Logo7TV from "@/assets/svg/logos/Logo7TV.vue";
import UiButton from "@/ui/UiButton.vue";

function openStorePage() {
	window.open(import.meta.env.VITE_APP_SITE + "/store", "_blank");
}
</script>

<style scoped lang="scss">
.seventv-button-subscribe {
	display: grid;
	place-items: center;
	place-content: center;
	align-items: center;
	align-content: center;
	grid-template-columns: repeat(2, auto);
	column-gap: 0.25em;
	box-shadow: none;
	background-image: linear-gradient(90deg, rgb(250, 170, 0) 0, rgb(255, 200, 50) 10%, rgb(250, 170, 0) 50%);
	animation-duration: 2s;
	animation-fill-mode: forwards;
	animation-iteration-count: infinite;
	animation-name: bg;
	animation-timing-function: linear;
	background-size: 200% 0.1rem;
	color: rgb(0, 0, 0);

	&:hover {
		filter: brightness(120%);
	}

	@keyframes bg {
		0% {
			background-position: 0 0;
		}

		100% {
			background-position: 200% 100%;
		}
	}
}
</style>
