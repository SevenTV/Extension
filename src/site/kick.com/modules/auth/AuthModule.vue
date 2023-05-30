<template>
	<AuthButton :slug="currentSlugDbc" />
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { debouncedRef } from "@vueuse/core";
import { declareModule } from "@/composable/useModule";
import { useApp } from "@/site/kick.com/composable/useApp";
import { useRouter } from "@/site/kick.com/composable/useRouter";
import AuthButton from "./AuthButton.vue";

const { markAsReady } = declareModule<"KICK">("auth", {
	name: "Auth",
	depends_on: [],
});

const app = useApp();
const router = useRouter(app);

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

markAsReady();
</script>
