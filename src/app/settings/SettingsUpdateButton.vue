<template>
	<div class="seventv-settings-update-button" :state="state" @click="doUpdateCheck()">
		<DownloadIcon />
		<span class="seventv-settings-expanded">
			<span>{{ title }}</span>
			<span>{{ subtitle }}</span>
		</span>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import useUpdater from "@/composable/useUpdater";
import DownloadIcon from "@/assets/svg/icons/DownloadIcon.vue";

const updater = useUpdater();

const title = ref("New Version Available");
const subtitle = ref(updater.latestVersion);
const state = ref<"OK" | "AVAILABLE" | "ERROR" | "PROGRESS">("AVAILABLE");

function doUpdateCheck(): void {
	if (state.value !== "AVAILABLE") return;
	state.value = "PROGRESS";

	updater
		.requestUpdateCheck()
		.then(() => {
			state.value = "OK";
			title.value = "Downloading";
			subtitle.value = "Please wait";
			updater.shouldRefreshOnUpdate = true;
		})
		.catch((err) => {
			state.value = "ERROR";
			title.value = "Update Failed";
			subtitle.value = err;
		});
}
</script>

<style scoped lang="scss">
.seventv-settings-update-button {
	cursor: pointer;
	display: grid;
	grid-template-columns: 1fr 3fr;
	align-items: center;
	justify-content: center;
	font-size: 1.5rem;
	margin: 0.75rem;
	outline: 0.25rem solid var(--seventv-accent);
	border-radius: 0.25rem;
	background: var(--seventv-background-shade-1);
	color: var(--seventv-accent);
	transition: background 0.25s ease-in-out, color 0.25s ease-in-out;

	&:hover {
		background: var(--seventv-accent);
		color: var(--seventv-background-shade-1);
	}

	&[state="PROGRESS"] {
		cursor: not-allowed;
		outline-color: var(--seventv-muted);
		color: var(--seventv-muted);

		&:hover {
			background: initial;
		}
	}

	&[state="ERROR"] {
		cursor: default;
		outline-color: var(--seventv-warning);
		color: var(--seventv-warning);

		&:hover {
			background: initial;
		}
	}

	&[state="OK"] {
		cursor: default;
		outline-color: var(--seventv-primary);
		color: var(--seventv-primary);

		&:hover {
			background: initial;
		}
	}

	> svg {
		margin: 0.5rem 1rem;
		vertical-align: middle;
		font-size: 2.5rem;
	}

	> span {
		margin: 0.5rem 0.25rem;
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
