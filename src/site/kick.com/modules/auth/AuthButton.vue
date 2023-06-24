<template>
	<!-- Display button on the current user's channel page -->
	<Teleport
		v-if="
			connectState !== 'done' &&
			identity &&
			slug === identity.username &&
			identityFetched &&
			(!appUser || !appUser.connections?.some((c) => c.platform === 'KICK'))
		"
		:to="channelContainer"
	>
		<div
			v-tooltip="'Connect ' + slug + ' on kick with 7TV!'"
			class="seventv-kick-connect"
			@click="popupAnchor = channelContainer"
		>
			<Logo7TV class="seventv-kick-connect-bouncy" />
			<p>{{ t("site.kick.connect_button_channel", { CHANNEL: "kick.com/" + slug }) }}</p>
		</div>
	</Teleport>

	<!-- Display button at navbar, top right -->
	<Teleport v-if="identity && connectState !== 'done'" :to="navContainer">
		<div
			v-tooltip="t('site.kick.connect_button_site')"
			v-tooltip:position="'bottom'"
			class="seventv-kick-connect-nav"
			@click="popupAnchor = navContainer"
		>
			<Logo7TV />
		</div>
	</Teleport>

	<!-- Connect Info Popup -->
	<template v-if="popupAnchor && identity">
		<UiFloating :anchor="popupAnchor" :middleware="[shift({ padding: 8 })]">
			<div ref="popupRef" class="seventv-connect-popup">
				<template v-if="!appUser">
					<h3 v-t="'site.kick.connect_button_site'" />
					<p v-if="identity && !connectError">
						{{
							t("site.kick.connect_popup_" + connectState, {
								ACTOR: identity.username,
							})
						}}
					</p>
					<p v-else>{{ connectError }}</p>

					<div v-if="connectState !== 'connecting'" class="seventv-connect-popup-buttons">
						<template v-if="connectState !== 'done'">
							<UiButton @click="connect">Continue</UiButton>
							<UiButton @click="closePopup">Cancel</UiButton>
						</template>
						<template v-else>
							<UiButton @click="openApp">Explore</UiButton>
						</template>
					</div>
				</template>
				<template v-else>
					<h3>7TV - Sign In</h3>
					<p v-if="connectState === 'connecting'">{{ t("site.kick.connect_popup_connecting") }}</p>
					<p v-else>
						{{ t("site.kick.connect_button_site_tooltip", { ACTOR: identity?.username }) }}
					</p>
					<div v-if="connectState !== 'connecting'" class="seventv-connect-popup-buttons">
						<UiButton @click="connect">Sign In</UiButton>
					</div>
				</template>
			</div>
		</UiFloating>
	</template>
</template>

<script setup lang="ts">
import { onUnmounted, ref, watchEffect } from "vue";
import { useI18n } from "vue-i18n";
import { onClickOutside, until, useLocalStorage, useTimeout } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { useStore } from "@/store/main";
import { LOCAL_STORAGE_KEYS } from "@/common/Constant";
import { useCookies } from "@/composable/useCookies";
import Logo7TV from "@/assets/svg/logos/Logo7TV.vue";
import { setBioCode } from "./Auth";
import UiButton from "@/ui/UiButton.vue";
import UiFloating from "@/ui/UiFloating.vue";
import { shift } from "@floating-ui/dom";

const props = defineProps<{
	slug: string;
}>();

defineEmits<{
	(e: "connect"): void;
}>();

const { t } = useI18n();
const store = useStore();
const { appUser, identityFetched, identity } = storeToRefs(store);
const cookies = useCookies();

const channelContainer = document.createElement("seventv-container");
channelContainer.id = "seventv-kick-connect";

const navContainer = document.createElement("seventv-container");
navContainer.id = "seventv-kick-connect-nav";

const popupAnchor = ref<HTMLElement | null>(null);
const popupRef = ref<HTMLElement | null>(null);
const connectState = ref<"idle" | "connecting" | "done">("idle");
const connectError = ref<Error | null>(null);
const appToken = useLocalStorage(LOCAL_STORAGE_KEYS.APP_TOKEN, "");

async function connect() {
	if (!identity.value) return;

	connectError.value = null;
	connectState.value = "connecting";

	const w = window.open("about:blank", "_blank", "width=500,height=400");
	if (!w) throw new Error("Failed to open window");

	w.blur();
	w.document.body.innerText = "Please wait...";

	const idy = identity.value as KickIdentity;
	let query = new URLSearchParams({
		platform: "KICK",
		id: idy.username,
	});

	const setError = (err: Error): void => {
		connectError.value = err;
		w.close();
	};

	await (async () => {
		// Get verification code
		const resp = await fetch(import.meta.env.VITE_APP_API + `/auth/manual?${query.toString()}`).catch((err) => {
			connectError.value = err;
		});
		if (!resp || !resp.ok) return setError(Error("failed to get verification code"));

		// Update user's kick bio with the code
		const code = await resp.text();
		const ok = await setBioCode(idy, code, cookies)
			.catch(setError)
			.then(() => true);
		if (!ok) return;

		// wait a few seconds for the bio to update
		await until(useTimeout(1e3 + 500)).toBeTruthy();

		query = new URLSearchParams({
			platform: "KICK",
			user_id: (identity.value as KickIdentity).username,
			manual: "1",
			skip_prompt: appUser.value ? "1" : "",
			callback: encodeURIComponent(window.location.origin + window.location.pathname),
		});

		if (w) w.location.href = import.meta.env.VITE_APP_SITE + "/auth/callback?" + query.toString();

		appToken.value = "";
		const i = setInterval(() => {
			if (!w) return clearInterval(i);
			if (!w.closed) return;

			if (appToken.value) connectState.value = "done";
			else connectState.value = "idle";

			clearInterval(i);
		}, 100);
	})();
}

function openApp(): void {
	window.open(import.meta.env.VITE_APP_SITE + "/emotes", "_blank");
}

function closePopup(): void {
	popupAnchor.value = null;
}

watchEffect(() => {
	const navBlock = document.querySelector(".main-navbar");
	if (navBlock) {
		navBlock.lastElementChild?.insertAdjacentElement("beforebegin", navContainer);
	}

	if (props.slug) {
		const channelInfoBlock = document.querySelector(".channel-info, .stream-info");
		if (channelInfoBlock) {
			channelInfoBlock.insertAdjacentElement("afterend", channelContainer);
		}
	}
});

onClickOutside(popupRef, closePopup);

onUnmounted(() => {
	channelContainer.remove();
	navContainer.remove();
});
</script>

<style scoped lang="scss">
.seventv-kick-connect {
	cursor: pointer;
	display: grid;
	grid-template-columns: auto 1fr;
	column-gap: 1rem;
	align-items: center;
	margin: 1rem 1.75rem;
	padding: 0.5rem;
	border-radius: 0.25rem;
	background: var(--seventv-background-shade-1);
	box-shadow: 0 0 0.35rem var(--seventv-primary);
	transition: background 140ms ease-in-out;

	svg {
		font-size: 3rem;
		animation: seventv-kick-connect 1.5s infinite ease-in-out;
	}

	p {
		font-size: 2rem;
		font-weight: 700;
	}

	&:hover {
		background: var(--seventv-highlight-neutral-1);
	}
}

svg.seventv-kick-connect-bouncy {
	animation: seventv-kick-connect 1.5s infinite ease-in-out;
}

.seventv-kick-connect-nav {
	width: 3rem;
	display: grid;
	justify-content: center;
	align-content: center;
	font-size: 1.75rem;

	svg {
		cursor: pointer;
	}
}

.seventv-connect-popup {
	padding: 1rem;
	max-width: 21rem;
	border-radius: 0.25rem;
	box-shadow: 0.1rem 0.1rem 0.25rem black;
	background-color: var(--seventv-background-shade-1);

	h3 {
		font-size: 1.5rem;
		font-weight: 700;
	}

	.seventv-connect-popup-buttons {
		display: grid;
		grid-auto-flow: column;
		justify-content: end;
		margin-top: 1rem;

		& > *:not(:last-child) {
			margin-right: 0.5rem;
		}
	}
}

@keyframes seventv-kick-connect {
	0% {
		transform: scale(1);
	}

	50% {
		transform: scale(1.05);
		color: var(--seventv-primary);
	}

	100% {
		transform: scale(1);
	}
}
</style>
