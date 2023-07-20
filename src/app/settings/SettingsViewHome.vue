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
						<span>v{{ version }}</span>
						<span v-if="isRemote" v-tooltip="'Running in Hosted Mode'" class="seventv-version-remote">
							<CloudIcon />
						</span>
					</span>
					<span class="seventv-settings-compact">API: {{ appServer }}</span>
				</div>
			</div>
		</div>
		<div ref="sidebarEl" class="seventv-settings-home-sidebar seventv-settings-compact">
			<a
				v-if="sidebarEl"
				class="twitter-timeline"
				noscrollbar="1"
				noborders="1"
				transparent="1"
				data-chrome="noheader nofooter noborders noscrollbar transparent"
				:data-tweet-limit="10"
				:data-height="sidebarEl.offsetHeight"
				:data-theme="theme.toLowerCase()"
				href="https://twitter.com/Official_7TV?ref_src=twsrc%5Etfw"
			/>
		</div>
	</div>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { useStore } from "@/store/main";
import { useUserAgent } from "@/composable/useUserAgent";
import Changelog from "@/site/global/Changelog.vue";
import CloudIcon from "@/assets/svg/icons/CloudIcon.vue";
import UiScrollable from "@/ui/UiScrollable.vue";

const { theme } = storeToRefs(useStore());

const { browser } = useUserAgent();

const appName = import.meta.env.VITE_APP_NAME;
const appContainer = import.meta.env.VITE_APP_CONTAINER ?? "Extension";
const appServer = import.meta.env.VITE_APP_API ?? "Offline";
const version = import.meta.env.VITE_APP_VERSION;
const isRemote = seventv.remote || false;

const sidebarEl = ref<HTMLElement | null>(null);

onMounted(() => {
	// Skip loading the twitter widget on Firefox
	if (browser.name === "Firefox") return;

	// Insert twitter widget
	const twitterScript = document.createElement("script");
	twitterScript.async = true;
	twitterScript.setAttribute("src", "https://platform.twitter.com/widgets.js");
	twitterScript.setAttribute("charset", "utf-8");

	document.head.appendChild(twitterScript);
});
</script>
<style scoped lang="scss">
.seventv-settings-home {
	display: grid;
	height: inherit;
	grid-template-columns: 1.25fr 21em;

	@media (width <= 1600px) {
		grid-template-columns: 1.25fr 0;

		.seventv-settings-home-sidebar {
			display: none !important;
		}
	}

	.seventv-settings-home-body {
		display: grid;
		min-width: 30rem;
		border-right: 1px solid var(--seventv-border-transparent-1);
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

	.seventv-settings-home-sidebar {
		z-index: 1;
		overflow: clip;
	}
}
</style>
