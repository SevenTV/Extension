<template>
	<div class="seventv-user-card-actions" />
</template>

<script setup lang="ts"></script>

<style scoped lang="scss">
.seventv-user-card-actions {
	grid-area: actions;
	display: grid;
	grid-auto-flow: row;
	grid-template-areas: "leftactions rightactions";
	grid-template-columns: 1fr 1fr;
	grid-template-rows: 1fr;
	gap: 0 1rem;
}

.rightactions {
	grid-area: rightactions;
}

.leftactions {
	grid-area: leftactions;
	display: grid;
	grid-template-columns: 1fr 1fr 1fr;
	grid-template-rows: 1fr;
	grid-auto-flow: row;
	grid-template-areas: ". . .";
}
</style>
