<template>
	<div class="frontpage-container">
		<div class="frontpage-body">
			<UiScrollable>
				<div class="frontpage-main">
					<Changelog />
				</div>
			</UiScrollable>
			<div class="frontpage-footer">
				<div class="seventv-settings-app-info">
					<span class="area-compact">{{ appName }} ({{ appContainer }})</span>
					<span class="seventv-version">v{{ version }}</span>
					<span class="area-compact">API: {{ appServer }}</span>
				</div>
			</div>
		</div>
		<div class="frontpage-side area-compact">
			<a
				class="twitter-timeline"
				data-height="580"
				:data-theme="theme.toLowerCase()"
				href="https://twitter.com/Official_7TV?ref_src=twsrc%5Etfw"
			/>
		</div>
	</div>
</template>
<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useStore } from "@/store/main";
import Changelog from "@/site/global/Changelog.vue";
import UiScrollable from "@/ui/UiScrollable.vue";

const { theme } = storeToRefs(useStore());

const appName = import.meta.env.VITE_APP_NAME;
const appContainer = import.meta.env.VITE_APP_CONTAINER ?? "Extension";
const appServer = import.meta.env.VITE_APP_API ?? "Offline";
const version = import.meta.env.VITE_APP_VERSION;

const twitterScript = document.createElement("script");
twitterScript.async = true;
twitterScript.setAttribute("src", "https://platform.twitter.com/widgets.js");
twitterScript.setAttribute("charset", "utf-8");

document.head.appendChild(twitterScript);
</script>
<style scoped lang="scss">
.frontpage-container {
	display: flex;
	height: 100%;

	.frontpage-body {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		border-right: 1px solid var(--seventv-border-transparent-1);

		.frontpage-main {
			padding: 1rem;
			flex-grow: 1;
		}

		.frontpage-footer {
			display: flex;
			position: sticky;
			bottom: -1px;
			border-top: 1px solid var(--seventv-border-transparent-1);
			align-items: center;
			padding: 0.5rem 1rem;
			background-color: var(--seventv-background-shade-1);
			.seventv-settings-app-info {
				flex-grow: 1;
				display: flex;
				justify-content: space-between;
				align-items: center;
				color: hsla(0deg, 0%, 50%, 90%);
			}
		}
	}

	.frontpage-side {
		margin: 1rem;
		width: 25em;
		flex-shrink: 0;
		height: 100%;
	}
}
</style>
