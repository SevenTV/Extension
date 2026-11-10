<template>
	<div class="profile">
		<template v-if="isExpired">
			<div>
				The 7TV session has expired, please sign out of the
				<a :href="site" target="_blank">7TV website</a>
				and then back in.
			</div>
		</template>
		<template v-else-if="actor.user && actor.token">
			You are authenticated with 7TV <br />
			Try using the custom 7TV commands in a channel where you have editor rights
		</template>
		<template v-else>
			<button class="login-button" @click="login">Sign in</button>
		</template>
	</div>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { Pausable, useIntervalFn } from "@vueuse/core";
import { decodeJWT } from "@/common/Jwt";
import { useActor } from "@/composable/useActor";
import { useConfig } from "@/composable/useSettings";

const site = import.meta.env.VITE_APP_SITE;
const src = site + "/extension/auth";

const actor = useActor();
const token = useConfig<string>("app.7tv.token");
const isExpired = ref(false);

let w: Window | null = null;
let s: Pausable | null = null;

const listener = (ev: MessageEvent) => {
	if (!ev.data) return;

	switch (ev.data.type) {
		case "7tv-token":
			if (!ev.data.token) return;
			s?.pause();
			w?.close();
			window.removeEventListener("message", listener);

			if ((decodeJWT(ev.data.token as string)?.exp ?? 0) * 1000 < Date.now()) {
				isExpired.value = true;
				return;
			}
			token.value = ev.data.token;
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
