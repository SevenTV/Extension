<template>
	<main class="onboarding-promo">
		<div class="header">
			<h1 v-t="'onboarding.promo_cta'" />
			<sub v-t="'onboarding.promo_plead'" />
		</div>
		<div class="cards">
			<!-- Paints -->
			<div v-tooltip="t('onboarding.promo_nametag_paints_tooltip')" class="card-box" name="paints">
				<span class="seventv-painted-content" :data-seventv-painted-text="true">CoolChatter777</span>
			</div>

			<!-- Personal Emotes -->
			<div v-tooltip="t('onboarding.promo_personal_emotes_tooltip')" class="card-box" name="personal-emotes">
				<div>
					<img src="https://cdn.7tv.app/emote/6042089e77137b000de9e669/2x.webp" />
				</div>
				<div>
					<img src="https://cdn.7tv.app/emote/60aee9d5361b0164e60d02c2/2x.webp" />
				</div>
				<div>
					<img src="https://cdn.7tv.app/emote/60ae7316f7c927fad14e6ca2/2x.webp" />
				</div>
			</div>

			<!-- Badges -->
			<div v-tooltip="t('onboarding.promo_badges_tooltip')" class="card-box" name="badges">
				<VectorBadge :background="{ component: BgBadge3 }" :logo="{ color: 'white' }" />
			</div>

			<!-- Animated Avatars -->
			<div v-tooltip="t('onboarding.promo_animated_avatars_tooltip')" class="card-box" name="animated-avatars">
				<div>
					<img src="https://cdn.7tv.app/emote/630393c6dd2e5e55608ef9f6/2x.webp" />
				</div>
			</div>

			<div class="card-explain">
				<p>
					{{ t("onboarding.promo_nametag_paints") }}
					<span v-tooltip="t('onboarding.promo_nametag_paints_caveat')" class="asterisk-note"> * </span>
				</p>
			</div>
			<div class="card-explain">{{ t("onboarding.promo_personal_emotes") }}</div>
			<div class="card-explain">{{ t("onboarding.promo_badges") }}</div>
			<div class="card-explain">{{ t("onboarding.promo_animated_avatars") }}</div>
		</div>
		<div class="interact">
			<UiButton class="interact-subscribe" @click="onSubscribeClick">
				<span v-t="'onboarding.promo_subscribe'" />
			</UiButton>
			<UiButton class="ui-button-hollow interact-skip" @click="onSkipClick">
				<span v-t="'onboarding.promo_reject'" />
			</UiButton>
		</div>
		<div class="footer"></div>
	</main>
</template>

<script setup lang="ts">
const emit = defineEmits<{
	(e: "completed"): void;
}>();

const { t } = useI18n();

function onSubscribeClick(): void {
	window.open("https://7tv.app/store", "_blank");
}

function onSkipClick(): void {
	emit("completed");
}
</script>

<script lang="ts">
import { useI18n } from "vue-i18n";
import BgBadge3 from "@/assets/svg/seventv/BgBadge3.vue";
import VectorBadge from "@/assets/svg/seventv/VectorBadge.vue";
import { OnboardingStepRoute } from "./Onboarding";
import UiButton from "@/ui/UiButton.vue";

export const step: OnboardingStepRoute = {
	name: "promotion",
	order: 77,
	color: "var(--seventv-subscriber-color)",
};
</script>

<style scoped lang="scss">
main {
	display: grid;
	grid-template: "header" max-content "cards" 1fr "interact" 1fr "footer" 1fr / 1fr;
	width: 100%;
	height: 100%;
	grid-auto-flow: row;
}

.header {
	display: grid;
	justify-self: center;
	grid-area: header;
	text-align: center;
	padding: 1.5rem;
	max-width: 50vw;

	h1 {
		font-size: 4vw;
	}

	sub {
		font-size: 0.95vw;
	}
}

.cards {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	grid-template-rows: 1fr 20%;
	grid-area: cards;
	align-items: end;
	justify-items: center;
	margin: 0 15vw;

	.card-box {
		display: grid;
		place-items: center;
		background: var(--seventv-background-shade-3);
		outline: 0.1rem solid var(--seventv-input-border);
		border-radius: 0.25rem;
		width: 12.5vw;
		height: 12.5vw;
		font-size: 1.25vw;
	}

	.card-explain {
		font-size: 1.25vw;

		.asterisk-note {
			padding: 0.5rem 0.25rem;
			color: var(--seventv-muted);
			height: 10rem;
			width: 100rem;

			&:hover {
				cursor: help;
			}
		}
	}

	.card-box[name="paints"] {
		.seventv-painted-content {
			background-image: linear-gradient(
				90deg,
				rgba(203, 255, 230, 100%) 0%,
				rgba(203, 255, 230, 100%) 20%,
				rgba(175, 233, 255, 100%) 20%,
				rgba(175, 233, 255, 100%) 40%,
				rgba(191, 185, 255, 100%) 40%,
				rgba(191, 185, 255, 100%) 60%,
				rgba(255, 207, 234, 100%) 60%,
				rgba(255, 207, 234, 100%) 80%,
				rgba(254, 255, 190, 100%) 80%,
				rgba(254, 255, 190, 100%) 100%
			);
			filter: drop-shadow(0 0 5px rgba(191, 185, 255, 100%));
		}
	}

	.card-box[name="personal-emotes"] {
		display: grid;
		grid-template: ". . ." 1fr / 0.5fr 1fr 0.5fr;
		gap: 0.5rem;
		padding: 0 0.5rem;

		> :last-child,
		> :first-child {
			opacity: 0.75;
		}

		> div {
			display: grid;
			place-items: center;
			width: 100%;
			height: auto;
			padding: 0.25rem;

			img {
				width: 100%;
				height: 100%;
				object-fit: contain;
			}
		}
	}

	.card-box[name="badges"] {
		font-size: 5vw;
	}

	.card-box[name="animated-avatars"] {
		> div {
			display: grid;
			place-items: center;
			outline: 0.25rem solid var(--seventv-primary);
			height: 50%;
			width: 50%;
			border-radius: 50%;
			background: rgb(20, 20, 20);

			img {
				width: 85%;
				height: 85%;
				object-fit: contain;
			}

			&::after {
				content: "LIVE";
				position: relative;
				top: 0.25vw;
				font-size: 0.85vw;
				font-weight: 700;
				padding: 0.05rem 0.25rem;
				background-color: var(--seventv-warning);
				outline: 0.1rem solid black;
				border-radius: 0.25em;
			}
		}
	}
}

.interact {
	display: flex;
	align-items: center;
	grid-area: interact;
	justify-content: center;
	column-gap: 1vw;

	button {
		padding: 0 2vw;
		height: 3vw;
		font-size: 1.5vw;
		box-shadow: none;
	}

	.interact-subscribe {
		padding: 0 2vw;
		height: 3vw;
		font-size: 1.5vw;
		box-shadow: none;
		background-image: linear-gradient(90deg, rgb(250, 170, 0) 0, rgb(255, 200, 50) 10%, rgb(250, 170, 0) 50%);
		animation-duration: 2s;
		animation-fill-mode: forwards;
		animation-iteration-count: infinite;
		animation-name: bg;
		animation-timing-function: linear;
		background-size: 200% 0.1rem;
		color: rgb(0, 0, 0);

		&:hover {
			filter: brightness(120%);
		}

		@keyframes bg {
			0% {
				background-position: 0 0;
			}

			100% {
				background-position: 200% 100%;
			}
		}
	}
}

.footer {
	grid-area: footer;
}
</style>
