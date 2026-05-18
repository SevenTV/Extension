<template>
	<div class="seventv-settings-home">
		<div class="seventv-settings-home-body">
			<UiScrollable>
				<div v-if="!ctx.newExtensionNoticeDismissed" class="seventv-settings-new-extension-notice">
					<div class="seventv-settings-new-extension-copy">
						<strong>Try the new 7TV extension</strong>
						<span>Give the new 7TV extension a try and see what we've been working on.</span>
					</div>
					<div class="seventv-settings-new-extension-actions">
						<UiButton class="ui-button-important" @click="openNewExtension">Check it out</UiButton>
						<button
							v-tooltip="'Dismiss'"
							aria-label="Dismiss notice"
							class="seventv-settings-new-extension-dismiss"
							type="button"
							@click="ctx.dismissNewExtensionNotice()"
						>
							<CloseIcon />
						</button>
					</div>
				</div>
				<div class="seventv-settings-home-changelog">
					<Changelog />
				</div>
			</UiScrollable>
			<div class="seventv-settings-home-footer">
				<div class="seventv-settings-app-info">
					<span class="seventv-settings-compact">{{ appName }} ({{ appContainer }})</span>
					<span class="seventv-version">
						<template v-if="isRemote">
							<span>v{{ remoteVersion }}</span>
							<span v-tooltip="'Running in Hosted Mode'" class="seventv-version-remote">
								<CloudIcon />
							</span>
						</template>
						<span v-else>v{{ version }}</span>
					</span>
					<span class="seventv-settings-compact">API: {{ appServer }}</span>
				</div>
			</div>
		</div>
	</div>
</template>
<script setup lang="ts">
import { useUserAgent } from "@/composable/useUserAgent";
import Changelog from "@/site/global/Changelog.vue";
import CloseIcon from "@/assets/svg/icons/CloseIcon.vue";
import CloudIcon from "@/assets/svg/icons/CloudIcon.vue";
import { useSettingsMenu } from "./Settings";
import UiButton from "@/ui/UiButton.vue";
import UiScrollable from "@/ui/UiScrollable.vue";

const appName = import.meta.env.VITE_APP_NAME;
const appContainer = import.meta.env.VITE_APP_CONTAINER ?? "Extension";
const appServer = import.meta.env.VITE_APP_API ?? "Offline";
const version = import.meta.env.VITE_APP_VERSION;
const isRemote = seventv.hosted || false;
const remoteVersion = seventv.host_manifest?.version;

const ctx = useSettingsMenu();
const { browser } = useUserAgent();

function openNewExtension(): void {
	const url =
		browser.name === "Firefox"
			? "https://addons.mozilla.org/en-US/firefox/addon/7tv-new/"
			: "https://chromewebstore.google.com/detail/7tv/lppmekppnliemjclknbagdhoocikieoi";

	window.open(url, "_blank");
}
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

		.seventv-settings-new-extension-notice {
			display: grid;
			grid-template-columns: 1fr auto;
			align-items: center;
			column-gap: 1rem;
			padding: 1rem 1.25rem;
			border-top: 0.1rem solid var(--seventv-primary);
			border-bottom: 0.1rem solid var(--seventv-border-transparent-1);
			background-color: var(--seventv-background-shade-3);

			.seventv-settings-new-extension-copy {
				display: grid;
				gap: 0.35rem;
				min-width: 0;

				> strong {
					color: var(--seventv-text-color-normal);
					font-size: 1.3rem;
				}

				> span {
					color: var(--seventv-text-color-secondary);
					line-height: 1.35;
				}
			}

			.seventv-settings-new-extension-actions {
				display: flex;
				align-items: center;
				gap: 0.75rem;
				min-height: 3rem;
			}

			.seventv-settings-new-extension-dismiss {
				all: unset;
				cursor: pointer;
				display: grid;
				place-items: center;
				width: 3rem;
				height: 3rem;
				border-radius: 0.25rem;
				color: var(--seventv-text-color-secondary);

				&:hover {
					background-color: var(--seventv-highlight-neutral-1);
					color: var(--seventv-text-color-normal);
				}

				> svg {
					width: 1.25rem;
					height: 1.25rem;
				}
			}
		}

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
