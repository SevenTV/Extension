<template>
	<div v-if="authToken && user">Nothing here yet</div>
	<div v-else class="profile-login">
		<button v-if="!granted" ref="loginButtonRef" class="login-button">Grant permission</button>
		<button v-else class="login-button" @click="openWebsite">Login</button>
	</div>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { log } from "@/common/Logger";
import { useExtensionPermission } from "@/composable/useExtensionPermission";
import { useConfig } from "@/composable/useSettings";

defineProps<{
	user?: SevenTV.User;
}>();

const authToken = useConfig<string>("app.seventv_bearer_token");

const loginButtonRef = ref<HTMLElement | null>(null);

const { granted } = useExtensionPermission(loginButtonRef, ["*://*.7tv.app/*", "*://*.7tv.io/*"]);

function openWebsite() {
	const win = window.open("https://7tv.app", "7TVOAuth2", "_blank, width=850, height=650, menubar=no, location=no");
	if (!win) return;
	win.focus();
	getToken().then(() => {
		win?.close();
	});
}

async function getToken() {
	return new Promise<string>((resolve, reject) => {
		window.addEventListener("message", (ev: MessageEvent) => {
			switch (ev.data.type) {
				case "seventv-auth-token-set": {
					const { token } = ev.data.data;

					if (!token) reject();
					authToken.value = token;
					log.info("<Extension>", "Token recieved from 7tv.app");
					resolve(token);

					break;
				}
			}
		});
		window.postMessage({
			type: "seventv-get-auth-token",
		});
	});
}
</script>
<style scoped lang="scss">
.profile-login {
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100%;

	.login-button {
		text-align: center;
		height: 4rem;
		width: 10rem;
		border: 1px solid var(--seventv-border-transparent-1);
		border-radius: 0.4rem;
	}
	.seventv-website {
		width: 100%;
		height: 100%;
	}
}
</style>
