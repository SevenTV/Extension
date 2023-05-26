<template>
	<div class="paint-tool-paint-card">
		<div for="name">
			<span v-cosmetic-paint="paint.id">{{ paint.data.name }}</span>
		</div>
		<div for="colorball">
			<div class="seventv-paint" :data-seventv-paint-id="paint.id" />
		</div>
	</div>
</template>

<script setup lang="ts">
defineProps<{
	paint: SevenTV.Cosmetic<"PAINT">;
}>();
</script>

<style scoped lang="scss">
.paint-tool-paint-card {
	cursor: pointer;
	width: 24rem;
	display: grid;
	grid-template-columns: 1fr 1fr 1fr;
	grid-template-rows: 1fr;
	grid-template-areas:
		"name name colorball"
		"metadata metadata metadata";
	background-color: var(--seventv-background-shade-2);
	padding: 0.5rem 1rem;
	border-radius: 0.25rem;
	align-items: center;

	&:hover {
		background-color: var(--seventv-highlight-neutral-1);
	}

	div[for="name"] {
		grid-area: name;
		display: grid;
		align-items: center;
		justify-content: start;

		> span {
			font-size: 1.25rem;
			font-weight: 700;
			display: inline-block;
			white-space: nowrap;
			text-overflow: ellipsis;
			overflow: hidden;
		}
	}

	div[for="colorball"] {
		grid-area: colorball;
		display: grid;
		justify-content: end;

		> div {
			width: 3rem;
			height: 3rem;
			clip-path: circle(50%);
		}
	}

	div[for="metadata"] {
		grid-area: metadata;
		display: grid;
	}
}
</style>
