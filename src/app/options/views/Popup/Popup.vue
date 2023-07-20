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
