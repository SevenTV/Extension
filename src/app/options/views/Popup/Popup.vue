import PopupInner from './PopupInner.vue';

<template>
	<main class="seventv-popup">
		<div>
			<PopupInner />
		</div>
	</main>
</template>

<script setup lang="ts">
import PopupInner from "./PopupInner.vue";

// Set the dimensions of the popup
document.body.style.height = "600px";
document.body.style.width = "800px";
</script>

<style scoped lang="scss">
main {
	display: block;
	background-color: var(--seventv-background-shade-1);

	> div {
		height: 600px;
		width: 800px;
	}
}
</style>
