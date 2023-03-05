<template>
	<main class="onboarding-platforms">
		<div class="header">
			<h1>Platform Selection</h1>
			<p>
				Select the plaforms onto which you'd like to enable 7TV. We'll configure the extension's permissions for
				you.
			</p>
		</div>
		<div class="sites">
			<div
				v-for="platform of platforms"
				:key="platform.name"
				class="supported-site"
				:selected="platform.selected"
				@click="toggle(platform)"
			>
				<component :is="platform.icon" />
			</div>
		</div>
		<div class="data">
			After confirming, we may ask you for additional permissions. You can change this later at any time.
		</div>
	</main>
</template>

<script setup lang="ts">
interface PlatformDef {
	name: string;
	icon: ComponentFactory | null;
	hosts: string[];
	selected?: boolean;
}

const ctx = useOnboarding("platforms");

onActivated(() => {
	ctx.setLock(true, () => {
		const selection = platforms.value.filter((p) => p.selected);
		if (selection.length === 0) return false;

		const hosts = selection.flatMap((p) => p.hosts);
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
	{ name: "Twitch", icon: markRaw(LogoBrandTwitch), hosts: ["*://*.twitch.tv/*"], selected: true },
	{ name: "YouTube", icon: markRaw(LogoBrandYouTube), hosts: ["*://*.youtube.com/*"], selected: true },
]);

function toggle(p: PlatformDef) {
	p.selected = !p.selected;
}
</script>

<script lang="ts">
import { markRaw, onActivated, onDeactivated, ref } from "vue";
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
		grid-template-columns: repeat(2, auto);
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
				animation: onSelect 0.5s ease-in-out;
			}

			@keyframes onSelect {
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
