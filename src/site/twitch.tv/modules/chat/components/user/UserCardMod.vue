<template>
	<div class="seventv-user-card-mod">
		<div />

		<div></div>

		<div />
	</div>
</template>

<script setup lang="ts"></script>

<style scoped lang="scss">
.seventv-user-card-mod {
	grid-area: modactions;
	display: grid;
	grid-template-columns: 3em 1fr 3em;
	grid-template-rows: 1fr;
	grid-template-areas: ". . .";
	height: 100%;
}
</style>
