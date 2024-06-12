<template>
	<div class="seventv-settings-home">
		<div class="seventv-settings-home-body">
			<UiScrollable>
				<div class="seventv-settings-home-changelog">
					<Changelog />
				</div>
			</UiScrollable>
			<div class="seventv-settings-home-footer">
				<div class="seventv-settings-app-info">
					<span class="seventv-settings-compact">{{ appName }} ({{ appContainer }})</span>
					<span class="seventv-version">
						<span v-if="isRemote" v-tooltip="'Running in Hosted Mode'" class="seventv-version-remote">
							<span>v{{ remoteVersion }}</span>
							<CloudIcon />
						</span>
						<span v-else>v{{ version }}</span>
					</span>
					<span class="seventv-settings-compact">API: {{ appServer }}</span>
				</div>
			</div>
		</div>
	</div>
</template>
<script setup lang="ts">
import Changelog from "@/site/global/Changelog.vue";
import CloudIcon from "@/assets/svg/icons/CloudIcon.vue";
import UiScrollable from "@/ui/UiScrollable.vue";

const appName = import.meta.env.VITE_APP_NAME;
const appContainer = import.meta.env.VITE_APP_CONTAINER ?? "Extension";
const appServer = import.meta.env.VITE_APP_API ?? "Offline";
const version = import.meta.env.VITE_APP_VERSION;
const isRemote = seventv.hosted || false;
const remoteVersion = seventv.host_manifest?.version;
</script>
<style scoped lang="scss">
.seventv-settings-home {
	display: grid;
	height: inherit;
	grid-template-columns: 1fr;

	.seventv-settings-home-body {
		display: grid;
		min-width: 30rem;
		overflow: auto;

		.seventv-settings-home-changelog {
			flex-grow: 1;
		}

		.seventv-settings-home-footer {
			position: sticky;
			bottom: 0;
			border-top: 0.1rem solid var(--seventv-border-transparent-1);
			align-items: center;
			padding: 0.5rem 1rem;
			background-color: var(--seventv-background-shade-1);

			.seventv-settings-app-info {
				flex-grow: 1;
				display: flex;
				justify-content: space-between;
				align-items: center;
				color: var(--seventv-text-color-secondary);
			}

			.seventv-version-remote {
				display: inline-block;
				vertical-align: middle;
				margin-left: 0.5rem;
				color: rgba(70, 225, 150, 100%);
			}
		}
	}
}
</style>
