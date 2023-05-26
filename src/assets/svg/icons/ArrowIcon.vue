<template>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 448 512"
		:direction="direction || 'down'"
		width="1em"
		height="1em"
		fill="currentColor"
	>
		<!--! Font Awesome Pro 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. -->
		<path
			d="M214.6 454.6L192 477.3l-22.6-22.6-144-144L2.7 288 48 242.8l22.6 22.6L160 354.8 160 64l0-32 64 0 0 32 0 290.7 89.4-89.4L336 242.8 381.3 288l-22.6 22.6-144 144z"
		/>
	</svg>
</template>

<script setup lang="ts">
defineProps<{
	direction: "up" | "down" | "left" | "right";
}>();
</script>

<style scoped lang="scss">
@import "@/assets/style/icon-direction";
</style>
