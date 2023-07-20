<template>
	<main class="seventv-popup-inner">
		<template v-if="activeTab.permissionsRequested">
			<div class="active-permission-request">
				<UiButton @click="onRequestActiveSitePermission()">Enable 7TV for {{ activeTab.host }}</UiButton>
			</div>
		</template>

		<template v-else>
			<h1>
				Coming Soon

				<p>You'll be able to see all the various chats you're connected to from here!</p>
			</h1>

			<div class="onboarding-button">
				<UiButton class="ui-button-important" @click="openOnboarding">
					<span>Onboarding</span>
					<ChevronIcon direction="right" />
				</UiButton>
			</div>
		</template>
	</main>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import { toRaw } from "vue";
import { HOSTNAME_SUPPORTED_REGEXP } from "@/common/Constant";
import ChevronIcon from "@/assets/svg/icons/ChevronIcon.vue";
import UiButton from "@/ui/UiButton.vue";

const activeTab = reactive({
	permissionsRequested: false,
	tab: null as chrome.tabs.Tab | null,
	host: "",
	hostPermissions: [] as string[],
});

chrome.tabs.query({ active: true }, (tabs) => {
	for (const tab of tabs) {
		if (!tab.url) continue;

		const url = new URL(tab.url);
		if (!HOSTNAME_SUPPORTED_REGEXP.test(url.host)) continue;

		activeTab.tab = tab;
		activeTab.host = url.host;
		activeTab.hostPermissions = [`*://*.${url.host}/*`];

		chrome.permissions.getAll((permissions) => {
			if (!permissions.origins) return;

			activeTab.permissionsRequested = !permissions.origins.some((origin) => {
				return origin === activeTab.hostPermissions[0];
			});
		});
	}
});

function onRequestActiveSitePermission() {
	if (!activeTab.tab) return;

	chrome.permissions.request({ origins: toRaw(activeTab.hostPermissions) }, (granted) => {
		if (!granted || !activeTab.tab || typeof activeTab.tab.id === "undefined") return;

		chrome.tabs.reload(activeTab.tab.id);
		window.close();
	});
}

function openOnboarding() {
	chrome.tabs.create({
		url: chrome.runtime.getURL("index.html#/onboarding/start"),
	});
}
</script>

<style scoped lang="scss">
main {
	height: 100%;
	padding: 1rem;

	p {
		font-size: 1rem;
	}

	.onboarding-button {
		margin-top: 1rem;
		font-size: 2rem;

		button {
			display: flex;
			align-items: center;
		}
	}

	// pogchamp button
	.active-permission-request {
		display: grid;
		height: 100%;
		place-items: center;

		> button {
			height: 4rem;
			font-size: 2rem;
			outline-color: var(--seventv-primary);
		}
	}
}
</style>
