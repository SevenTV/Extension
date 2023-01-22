<template>
	<SettingsMenuButton @toggle="toggle" />

	<div v-show="show" ref="el" class="seventv-settings-menu-container">
		<div class="settings-menu">
			<div class="header">
				<div class="header-left">
					<div class="header-icon">
						<Logo7TV />
						<h4>{{ appName }} Settings</h4>
					</div>
				</div>
				<div class="header-right">
					<button class="header-icon header-button" @click.prevent="toggle">
						<TwClose />
					</button>
				</div>
			</div>
			<div class="body">
				<div class="seventv-settings-sidebar">
					<div />
					<div class="seventv-settings-app-info">
						<p>{{ appName }} ({{ appContainer }})</p>
						<p class="seventv-version">v{{ version }}</p>
						<p>API: {{ appServer }}</p>
					</div>
				</div>
				<UiScrollable>
					<div class="settings-area">
						<template v-for="[key, node] of Object.entries(getNodes())">
							<SettingsNode v-if="node.type !== 'NONE'" :key="key" :node="node" />
						</template>
					</div>
				</UiScrollable>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useSettings } from "@/composable/useSettings";
import Logo7TV from "@/assets/svg/logos/Logo7TV.vue";
import TwClose from "@/assets/svg/twitch/TwClose.vue";
import SettingsMenuButton from "./SettingsMenuButton.vue";
import SettingsNode from "./SettingsNode.vue";
import UiScrollable from "@/ui/UiScrollable.vue";

const { getNodes } = useSettings();

const appName = import.meta.env.VITE_APP_NAME;
const appContainer = import.meta.env.VITE_APP_CONTAINER ?? "Extension";
const appServer = import.meta.env.VITE_APP_API_REST ?? "Offline";
const version = import.meta.env.VITE_APP_VERSION;

const show = ref(false);
const el = ref(null);

function toggle() {
	show.value = !show.value;
}
</script>

<style scoped lang="scss">
.seventv-settings-menu-container {
	position: absolute;
	display: flex;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	justify-content: center;
	align-items: center;
	z-index: 9999;
	pointer-events: none;
}

.settings-menu {
	pointer-events: all;
	backdrop-filter: blur(16px);
	background: var(--seventv-background-transparent-1);
	border-radius: 0.6rem;
	border: 1px solid var(--seventv-border-transparent-1);
}

.header {
	height: 4rem;
	border-bottom: 1px solid var(--seventv-border-transparent-1);
	display: flex;
	justify-content: space-between;
}

.header-icon {
	display: grid;
	grid-template-columns: 3em auto auto;
	column-gap: 0.25em;
	align-items: center;
	height: 100%;
	margin: auto;
	padding: 0.5rem;

	> .seventv-version {
		font-size: 0.75em;
	}

	& > svg {
		height: 100%;
		width: 100%;
	}
}
.header-button {
	cursor: pointer;
	fill: currentColor;

	&:hover {
		background: hsla(0deg, 0%, 50%, 32%);
	}
}

.body {
	height: 60rem;
	display: flex;
	overflow: auto;
}

.seventv-settings-sidebar {
	position: sticky;
	height: 100%;
	width: 20rem;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	flex-grow: 0;
	flex-shrink: 0;
	border-right: 1px solid var(--seventv-border-transparent-1);

	.seventv-settings-app-info {
		padding: 0.35em;
		border-top: 1px solid currentColor;

		> p {
			&:first-child {
				font-weight: bold;
			}

			font-size: 1rem;
		}
	}
}

.settings-area {
	height: 100%;
}
</style>
