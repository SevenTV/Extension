<template>
	<div v-if="actor.token" class="profile">
		Hello {{ actor.user?.display_name }} <br />
		You are authenticated with 7TV <br />
		Try using the the custom 7TV commands if a channel where you have editor rights
	</div>
	<iframe v-if="!token" ref="iframe" :src="src" width="100%" height="100%" />
</template>
<script setup lang="ts">
import { onBeforeMount, onUnmounted } from "vue";
import { useActor } from "@/composable/useActor";
import { useConfig } from "@/composable/useSettings";

const src = import.meta.env.VITE_APP_SITE + "/extension/auth";

const actor = useActor();
const token = useConfig<string>("app.7tv.token");
const listener = (ev: MessageEvent) => {
	const data = ev.data;
	if (data && data.type === "7tv-token") {
		token.value = data.token;
	}
};

onBeforeMount(() => {
	window.addEventListener("message", listener);
});

onUnmounted(() => {
	window.removeEventListener("message", listener);
});
</script>
<style scoped lang="scss">
.profile {
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100%;
}
</style>
