<template>
	<AuthButton :slug="currentSlugDbc" />
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { debouncedRef, useLocalStorage } from "@vueuse/core";
import { useStore } from "@/store/main";
import { LOCAL_STORAGE_KEYS } from "@/common/Constant";
import { useCookies } from "@/composable/useCookies";
import { declareModule } from "@/composable/useModule";
import { setBioCode } from "./Auth";
import AuthButton from "./AuthButton.vue";

const { markAsReady } = declareModule<"KICK">("auth", {
	name: "Auth",
	depends_on: [],
});

const cookies = useCookies();
const store = useStore();

const currentSlug = ref("");
const currentSlugDbc = debouncedRef(currentSlug, 1e3);

function updateSlug() {
	const path = location.pathname.split("/");
	if (path[1] == "popout") {
		currentSlug.value = path[2];
	} else {
		currentSlug.value = path[1];
	}
}

const observer = new MutationObserver((mutationList) => {
	for (const mutation of mutationList) {
		for (let i = 0; i < mutation.addedNodes.length; i++) {
			if (mutation.addedNodes.item(i)?.nodeName == "TITLE") {
				updateSlug();
				break;
			}
		}
	}
});

const head = document.getElementsByTagName("head")[0];
observer.observe(head, { childList: true, subtree: true });

const appToken = useLocalStorage(LOCAL_STORAGE_KEYS.APP_TOKEN, "");
const urlParams = new URLSearchParams(window.location.search);

if (urlParams.get("seventv_token")) {
	watch(
		() => store.identity,
		(identity) => {
			if (!urlParams.get("seventv_token")) return;

			appToken.value = urlParams.get("seventv_token");

			setBioCode(identity as KickIdentity, "", cookies).then(() => {
				setTimeout(() => {
					window.close();
				}, 250);
			});
		},
		{ immediate: true },
	);
}

updateSlug();
markAsReady();
</script>
