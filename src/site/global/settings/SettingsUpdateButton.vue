<template>
	<div class="seventv-settings-update-button" :error="!!error" :progress="progress" @click="doUpdateCheck()">
		<DownloadIcon />
		<span>
			<span>{{ error ? "Download Failed" : "New Version Available" }}</span>
			<span>{{ error ? error : updater.latestVersion }}</span>
		</span>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import useUpdater from "@/composable/useUpdater";
import DownloadIcon from "@/assets/svg/icons/DownloadIcon.vue";

const updater = useUpdater();
const error = ref("");
const progress = ref(false);

function doUpdateCheck(): void {
	if (progress.value || error.value) return;
	progress.value = true;

	updater
		.requestUpdateCheck()
		.finally(() => (progress.value = false))
		.catch((err) => {
			error.value = err as string;
		});
}
</script>

<style scoped lang="scss">
.seventv-settings-update-button {
	cursor: pointer;
	display: grid;
	grid-template-columns: 1fr 3fr;
	align-items: center;
	font-size: 1.5rem;
	margin: 1rem;
	padding: 1rem;
	outline: 0.25rem solid var(--seventv-accent);
	border-radius: 0.25rem;
	background: var(--seventv-background-shade-1);
	color: var(--seventv-accent);
	transition: background 0.2s ease-in-out, color 0.2s ease-in-out;

	&:hover {
		background: var(--seventv-accent);
		color: var(--seventv-background-shade-1);
	}

	&[progress="true"] {
		cursor: not-allowed;
		outline-color: var(--seventv-muted);
		color: var(--seventv-muted);

		&:hover {
			background: initial;
		}
	}

	&[error="true"] {
		cursor: default;
		outline-color: var(--seventv-warning);
		color: var(--seventv-warning);

		&:hover {
			background: initial;
		}
	}

	> svg {
		vertical-align: middle;
		font-size: 2.5rem;
		margin-right: 0.5rem;
	}

	> span {
		font-size: 1.15rem;
		font-weight: 700;
		white-space: nowrap;

		:last-child {
			display: block;
			font-weight: 400;
		}
	}
}
</style>
