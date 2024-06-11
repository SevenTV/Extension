<template>
	<div class="profile">
		<template v-if="actor.user && actor.token">
			You are authenticated with 7TV <br />
			Try using the the custom 7TV commands if a channel where you have editor rights
		</template>
		<template v-else>
			<button class="login-button" @click="login">Sign in</button>
		</template>
	</div>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { Pausable, useIntervalFn } from "@vueuse/core";
import { useActor } from "@/composable/useActor";
import { useConfig } from "@/composable/useSettings";

const src = import.meta.env.VITE_APP_SITE + "/extension/auth";

const actor = useActor();
const token = useConfig<string>("app.7tv.token");

let w: Window | null = null;
let s: Pausable | null = null;

const listener = (ev: MessageEvent) => {
	if (!ev.data) return;

	switch (ev.data.type) {
		case "7tv-token":
			token.value = ev.data.token;
			w?.close();
			s?.pause();
			window.removeEventListener("message", listener);
			break;
	}
};

function login() {
	if (token.value !== "") return;
	if (w && !w.closed) {
		w.focus();
		return;
	}
	w = window.open(src, "7tv-auth", "width=400,height=600");
	if (!w) return;
	window.addEventListener("message", listener);
	s = useIntervalFn(() => {
		w?.postMessage("7tv-token-request", "*");
	}, 100);
}

onMounted(login);

onUnmounted(() => {
	w?.close();
	window.removeEventListener("message", listener);
});
</script>
<style scoped lang="scss">
.profile {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	height: 100%;
	padding: 1rem;

	.login-button {
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		border: 1px solid var(--color-border-base);
		border-radius: 0.25rem;
	}
}
</style>
