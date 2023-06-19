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
import { useApp } from "@/site/kick.com/composable/useApp";
import { useRouter } from "@/site/kick.com/composable/useRouter";
import { setBioCode } from "./Auth";
import AuthButton from "./AuthButton.vue";

const { markAsReady } = declareModule<"KICK">("auth", {
	name: "Auth",
	depends_on: [],
});

const app = useApp();
const router = useRouter(app);
const cookies = useCookies();
const store = useStore();

const currentSlug = ref("");
const currentSlugDbc = debouncedRef(currentSlug, 1e3);

watch(
	() => router.currentRoute,
	(v) => {
		if (!v || v.name !== "channel") return;

		currentSlug.value = typeof v.params.channel === "string" ? v.params.channel ?? "" : "";
	},
	{ immediate: true },
);

const appToken = useLocalStorage(LOCAL_STORAGE_KEYS.APP_TOKEN, "");

if (router.currentRoute && router.currentRoute.query.seventv_token) {
	watch(
		() => store.identity,
		(identity) => {
			if (!router.currentRoute || !router.currentRoute.query.seventv_token) return;

			appToken.value = router.currentRoute.query.seventv_token.toString();

			setBioCode(identity as KickIdentity, "", cookies);
			window.close();
		},
		{ immediate: true },
	);
}

markAsReady();
</script>
