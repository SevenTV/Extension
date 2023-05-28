<template>
	<!-- Display button on the current user's channel page -->
	<Teleport :to="channelContainer">
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
	<Teleport :to="navContainer">
		<div
			v-tooltip="t('site.kick.connect_button_site')"
			v-tooltip:position="'bottom'"
			class="seventv-kick-connect-nav"
			@click="popupAnchor = navContainer"
		>
			<Logo7TV class="seventv-kick-connect-bouncy" />
		</div>
	</Teleport>

	<!-- Connect Info Popup -->
	<template v-if="popupAnchor">
		<UiFloating :anchor="popupAnchor" :middleware="[shift({ padding: 8 })]">
			<div ref="popupRef" class="seventv-connect-popup">
				<h3 v-t="'site.kick.connect_button_site'" />
				<p v-if="identity">
					{{
						t("site.kick." + (connectDone ? "connect_popup_done" : "connect_popup_confidence"), {
							ACTOR: identity.username,
						})
					}}
				</p>

				<div class="seventv-connect-popup-buttons">
					<template v-if="!connectDone">
						<UiButton @click="connect">Continue</UiButton>
						<UiButton @click="closePopup">Cancel</UiButton>
					</template>
					<template v-else>
						<UiButton @click="openApp">Explore</UiButton>
					</template>
				</div>
			</div>
		</UiFloating>
	</template>
</template>

<script setup lang="ts">
import { onUnmounted, ref, watchEffect } from "vue";
import { useI18n } from "vue-i18n";
import { onClickOutside, until, useTimeout } from "@vueuse/core";
import { useStore } from "@/store/main";
import { log } from "@/common/Logger";
import { useCookies } from "@/composable/useCookies";
import Logo7TV from "@/assets/svg/logos/Logo7TV.vue";
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
const identity = store.identity as KickIdentity | null;
const cookies = useCookies();

const channelContainer = document.createElement("seventv-container");
channelContainer.id = "seventv-kick-connect";

const navContainer = document.createElement("seventv-container");
navContainer.id = "seventv-kick-connect-nav";

const popupAnchor = ref<HTMLElement | null>(null);
const popupRef = ref<HTMLElement | null>(null);
const connectError = ref<Error | null>(null);
const connectDone = ref(false);

async function connect() {
	if (!identity) return;

	connectError.value = null;
	connectDone.value = false;

	const w = window.open("about:blank", "_blank", "width=1,height=1");
	if (!w) throw new Error("Failed to open window");

	w.blur();
	w.document.body.innerText = "Standby...";

	const query = new URLSearchParams({
		platform: "KICK",
		id: identity.username,
	});

	await (async () => {
		// Get verification code
		let resp = await fetch(import.meta.env.VITE_APP_API + `/auth/manual?${query.toString()}`).catch((err) => {
			connectError.value = err;
		});
		if (!resp || !resp.ok) return Promise.reject("failed to get verification code");

		// Update user's kick bio with the code
		const code = await resp.text();
		const ok = await setBioCode(code)
			.catch((err) => {
				Promise.reject(err);
			})
			.then(() => true);
		if (!ok) return;

		// wait a few seconds for the bio to update
		await until(useTimeout(2500)).toBeTruthy();

		// Request the API to verify the code in bio
		query.set("verify", "1");
		resp = await fetch(import.meta.env.VITE_APP_API + `/auth/manual?${query.toString()}`, {
			credentials: "include",
		}).catch((err) => {
			Promise.reject(err);
		});
		if (!resp || !resp.ok) return;

		const tok = resp.headers.get("X-Access-Token");
		if (w) w.location.href = import.meta.env.VITE_APP_SITE + "/auth/callback?token=" + tok;

		setBioCode("").catch((err) => {
			log.error("failed to clear bio", err);
		});

		Promise.resolve();
	})()
		.catch((err) => {
			connectError.value = err;
		})
		.then(() => {
			connectDone.value = true;
		});

	w.close();
}

const tokenWrapRegexp = /\[7TV:[0-9a-fA-F]+\]/g;
async function setBioCode(code: string) {
	if (!identity) return;

	const tokenWrap = `[7TV:${code}]`;

	const auth = cookies.get("XSRF-TOKEN");
	if (!auth) return;

	const headers = new Headers();
	headers.set("x-xsrf-token", auth ?? "");
	headers.set("Content-Type", "application/json");

	const cleanBio = identity.bio?.replace(tokenWrapRegexp, "").trim() ?? "";
	const newBio = code ? (identity.bio ? `${cleanBio} ${tokenWrap}` : tokenWrap) : cleanBio;

	fetch("https://kick.com/update_profile", {
		headers: {
			"content-type": "application/json",
			"x-xsrf-token": auth,
		},
		referrer: "https://kick.com/dashboard/settings/profile",
		referrerPolicy: "strict-origin-when-cross-origin",
		body: JSON.stringify({
			id: identity.id,
			email: identity.email,
			bio: newBio,
		}),
		method: "POST",
		mode: "cors",
		credentials: "include",
	}).then((resp) => {
		if (!resp.ok) return;

		identity.bio = newBio;
	});
}

function openApp(): void {
	window.open(import.meta.env.VITE_APP_SITE + "/emotes", "_blank");
}

function closePopup(): void {
	popupAnchor.value = null;
	if (connectDone.value) openApp();
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
