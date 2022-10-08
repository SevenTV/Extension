<template>
	<ChatController v-if="dependenciesMet" @hooked="onHooked" />
</template>

<script setup lang="ts">
import { useModule } from "@/composable/useModule";
import ChatController from "./ChatController.vue";

const { dependenciesMet, markAsReady } = useModule("chat", {
	name: "Chat",
	depends_on: [],
});

function onHooked() {
	markAsReady();
}
</script>
