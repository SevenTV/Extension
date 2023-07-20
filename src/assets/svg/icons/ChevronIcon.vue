/* Font Awesome Pro 6.3.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license
(Commercial License) Copyright 2023 Fonticons, Inc. */
<template>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 512 512"
		:direction="direction || 'down'"
		width="1em"
		height="1em"
		fill="currentColor"
	>
		<path
			d="M238 429.3l22.6-22.6 192-192L475.3 192 430 146.7l-22.6 22.6L238 338.7 68.6 169.4 46 146.7 .7 192l22.6 22.6 192 192L238 429.3z"
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
