<template>
	<main class="onboarding-end">
		<div class="header">
			<h1 v-t="'onboarding.end_title'" />
			<p v-t="'onboarding.end_subtitle'" />
		</div>
		<div v-show="discord.loaded" class="discord">
			<h2>
				{{ discord.name }} on Discord
				<sub>{{ discord.online_members }} members online</sub>
			</h2>

			<div />
			<UiButton @click="onOpenDiscordInvite">
				<template #icon>
					<LogoBrandDiscord />
				</template>

				<span v-t="'onboarding.button_join'" />
			</UiButton>
		</div>
		<div class="rate">
			<h2>
				{{ t("onboarding.end_review1") }}
				<sub v-t="'onboarding.end_review2'" />
			</h2>

			<div class="stars" @click="openReviewLink">
				<StarIcon v-for="k in Array(5)" :key="k" />
			</div>
			<UiButton @click="openReviewLink">
				<span v-t="'onboarding.button_review'" />
			</UiButton>
		</div>
		<div class="social">
			<h2>
				{{ t("onboarding.end_social_media1") }}
				<sub v-t="'onboarding.end_social_media2'" />
			</h2>

			<div>
				<LogoBrandTwitter @click="openTwitter" />
			</div>
		</div>
	</main>
</template>

<script setup lang="ts">
import { onActivated, reactive } from "vue";
import { OnboardingStepRoute, useOnboarding } from "./Onboarding";
import UiButton from "@/ui/UiButton.vue";
import LogoBrandDiscord from "@/assets/svg/logos/LogoBrandDiscord.vue";
import StarIcon from "@/assets/svg/icons/StarIcon.vue";
import { useUserAgent } from "@/composable/useUserAgent";
import LogoBrandTwitter from "@/assets/svg/logos/LogoBrandTwitter.vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

useOnboarding("platforms");
const ua = useUserAgent();

const discord = reactive({
	loaded: false,
	name: "",
	invite: "",
	online_members: 0,
});

fetch("https://discord.com/api/guilds/817075418054000661/widget.json").then(async (res) => {
	const d = await res.json();

	discord.name = d.name;
	discord.invite = d.instant_invite;
	discord.online_members = d.presence_count;
	discord.loaded = true;
});

function onOpenDiscordInvite(): void {
	chrome.tabs.create({ url: discord.invite });
}

function openReviewLink(): void {
	switch (ua.browser.name) {
		case "Firefox":
			chrome.tabs.create({ url: "https://addons.mozilla.org/en-US/firefox/addon/7tv/" });
			break;

		default:
			chrome.tabs.create({
				url: "https://chrome.google.com/webstore/detail/7tv/ammjkodgmmoknidbanneddgankgfejfh",
			});
			break;
	}
}

function openTwitter(): void {
	chrome.tabs.create({ url: "https://twitter.com/Official_7TV" });
}

onActivated(() => {
	if (!chrome || !chrome.storage) return;
	chrome.storage.local.remove("upgraded");
});
</script>

<script lang="ts">
export const step: OnboardingStepRoute = {
	name: "end",
	order: 100,
	color: "var(--seventv-primary)",
};
</script>

<style scoped lang="scss">
.social {
	grid-area: social;
	display: flex !important;

	> div {
		display: grid;
		justify-content: center;
	}

	svg {
		cursor: pointer;
		background: rgb(29, 161, 242);
		border-radius: 0.25rem;
		padding: 0.5rem;
		font-size: 3vw;
	}
}

main.onboarding-end {
	width: 100%;
	display: grid;
	grid-template-areas:
		"header header header"
		"discord rate social";
	place-items: center;

	> div:not(.header) {
		background: var(--seventv-background-shade-2);
		outline: 0.1rem solid var(--seventv-input-border);
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 1rem;

		h2 {
			font-size: 1.5rem;
		}

		sub {
			display: block;
			font-weight: 500;
			font-size: 1rem;
		}

		button {
			height: 3rem;
		}
	}

	margin: 0 5%;
}

.header {
	grid-area: header;
	justify-self: center;
	align-self: center;
	text-align: center;
	max-width: 40vw;

	h1 {
		font-size: 4vw;
	}

	p {
		font-size: 1vw;
	}
}

.discord {
	grid-area: discord;
	background: var(--seventv-background-shade-2);
	border-radius: 0.25rem;
}

.rate {
	grid-area: rate;
	display: grid p {
		font-size: 1rem;
	}

	.stars {
		cursor: pointer;
		display: grid;
		justify-content: center;
		grid-template-columns: repeat(5, 3rem);
		font-size: 2.5rem;
	}
}
</style>
