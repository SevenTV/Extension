<template>
	<main class="onboarding-platforms">
		<div class="header">
			<h1 v-t="'onboarding.platforms_title'" />
			<p v-t="'onboarding.platforms_subtitle'" />
		</div>
		<div class="sites">
			<div
				v-for="platform of platforms"
				:key="platform.name"
				class="supported-site"
				:selected="platform.selected"
				@click="toggle(platform)"
			>
				<component :is="(platform.icon as AnyInstanceType)" />
			</div>
		</div>
		<div v-t="'onboarding.platforms_mutable_note'" class="data" />
	</main>
</template>

<script setup lang="ts">
interface PlatformDef {
	name: string;
	icon: ComponentFactory | null;
	hosts?: string[];
	selected?: boolean;
}

const ctx = useOnboarding("platforms");

onActivated(() => {
	ctx.setLock(true, () => {
		const selection = platforms.value.filter((p) => p.selected);
		if (selection.length === 0) return false;

		const hosts = selection.flatMap((p) => p.hosts ?? []);
		chrome.permissions.request({ origins: hosts }, (granted) => {
			if (granted) {
				ctx.setLock(false);
			}
		});
	});
});

onDeactivated(() => {
	ctx.setCompleted(true);
});

const platforms = ref<PlatformDef[]>([
	{ name: "Twitch", icon: markRaw(LogoBrandTwitch), selected: true },
	{ name: "YouTube", icon: markRaw(LogoBrandYouTube), hosts: ["*://*.youtube.com/*"], selected: true },
	{ name: "Kick", icon: markRaw(LogoBrandKick), hosts: ["*://*.kick.com/*"], selected: true },
]);

function toggle(p: PlatformDef) {
	p.selected = !p.selected;
}
</script>

<script lang="ts">
import { markRaw, onActivated, onDeactivated, ref } from "vue";
import LogoBrandKick from "@/assets/svg/logos/LogoBrandKick.vue";
import LogoBrandTwitch from "@/assets/svg/logos/LogoBrandTwitch.vue";
import LogoBrandYouTube from "@/assets/svg/logos/LogoBrandYouTube.vue";
import { OnboardingStepRoute, useOnboarding } from "./Onboarding";

export const step: OnboardingStepRoute = {
	name: "platforms",
	order: 1,
};
</script>

<style scoped lang="scss">
main.onboarding-platforms {
	width: 100%;
	display: grid;
	grid-template-rows: 1fr 1fr 1fr;
	grid-template-areas:
		"header"
		"sites"
		"data";

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

	.sites {
		display: grid;
		grid-template-columns: repeat(3, auto);
		gap: 4vw;
		grid-area: sites;
		justify-self: center;

		.supported-site {
			display: grid;
			place-items: center;
			background: var(--seventv-input-background);
			outline: 0.1rem solid var(--seventv-input-border);
			border-radius: 0.25rem;
			width: 12.5vw;
			height: 12.5vw;

			svg {
				font-size: 20em;
				width: 12vw;
				height: 6vw;
			}

			transition: outline-color 0.5s ease-in-out;

			&:hover {
				cursor: pointer;
				user-select: none;
				outline-color: var(--seventv-text-color-normal);
			}

			&[selected="true"] {
				outline-color: var(--seventv-accent);
				outline-width: 0.2rem;
				animation: on-select 0.5s ease-in-out;
			}

			@keyframes on-select {
				25% {
					transform: scale(1.05);
				}

				100% {
					transform: scale(1);
				}
			}
		}
	}

	.data {
		display: grid;
		grid-area: data;
		justify-self: center;
		color: var(--seventv-muted);
		font-size: 0.92vw;
	}
}
</style>
