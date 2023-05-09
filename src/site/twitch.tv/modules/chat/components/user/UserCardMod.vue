<template>
	<div class="seventv-user-card-mod">
		<div class="seventv-user-card-mod-side seventv-user-card-mod-ban">b</div>

		<div class="seventv-user-card-mod-timeout-options">
			<button v-for="opt of timeoutOptions" :key="opt">{{ opt }}</button>
		</div>

		<div class="seventv-user-card-mod-side seventv-user-card-mod-moderator">m</div>
	</div>
</template>

<script setup lang="ts">
const timeoutOptions = ["1s", "30s", "1m", "5m", "30m", "1h", "4h", "12h", "1d"];
</script>

<style scoped lang="scss">
.seventv-user-card-mod {
	display: grid;
	grid-template-columns: 3em 1fr 3em;
	grid-template-rows: 1fr;
	grid-template-areas: ". . .";
	height: 2rem;
	border-top: 0.1rem solid hsla(0deg, 0%, 100%, 0.1);

	.seventv-user-card-mod-timeout-options {
		display: grid;
		grid-template-columns: repeat(9, 1fr);
		grid-template-rows: 1fr;
		grid-template-areas: ". . . . . . . . .";
		gap: 0 0.5rem;
		color: var(--seventv-muted);
	}

	.seventv-user-card-mod-side {
		display: grid;
		justify-content: center;
	}
}
</style>
