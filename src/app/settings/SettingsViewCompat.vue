<template>
	<main class="seventv-settings-compat">
		<h3>
			Compatibility
			<p>Scan your extensions for compatibility issues</p>
		</h3>

		<iframe v-if="supportsAPI" :src="optionsURL + '#/compat?noheader=1'" />
	</main>
</template>

<script setup lang="ts">
import { inject } from "vue";
import { SITE_EXT_OPTIONS_URL } from "@/common/Constant";
import { useUserAgent } from "@/composable/useUserAgent";

const { browser } = useUserAgent();
const optionsURL = inject(SITE_EXT_OPTIONS_URL, "");
const supportsAPI = browser.name !== "Firefox";

// firefox doesn't support using browser apis from an iframe
// so we open a new tab instead
if (!supportsAPI) {
	window.open(optionsURL + "#/compat", "_blank");
}
</script>

<style scoped lang="scss">
main.seventv-settings-compat {
	display: grid;
	grid-template-rows: 6rem auto 1rem;
	width: 100%;
	height: 100%;

	h3 {
		display: grid;
		margin: 1rem;
		align-items: center;
		text-align: center;
		font-size: 2rem;
	}

	iframe {
		height: 100%;
		width: inherit;
	}
}
</style>
