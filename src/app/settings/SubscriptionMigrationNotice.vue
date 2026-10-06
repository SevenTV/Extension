<template>
	<section v-if="notice.visible" class="seventv-migration-notice" aria-labelledby="seventv-migration-notice-title">
		<picture class="seventv-migration-notice-badge">
			<source type="image/avif" :srcset="`${badgeUrl}.avif`" />
			<source type="image/webp" :srcset="`${badgeUrl}.webp`" />
			<img :src="`${badgeUrl}.png`" alt="Foxy badge" width="48" height="48" decoding="async" />
		</picture>
		<div class="seventv-migration-notice-copy">
			<strong id="seventv-migration-notice-title">We need to update your subscription</strong>
			<p>
				We need to update your billing details due to administrative changes. We are simply changing accounts to
				point to the UK instead of France. This helps us enormously, it's free, it's a one-click process and to
				say thank you, we are giving you this free badge and paint.
			</p>
			<div class="seventv-migration-notice-rewards">
				<span>Foxy <span class="seventv-migration-notice-kind">badge</span></span>
				<span>
					<span v-cosmetic-paint="notice.rewardPaintLoaded ? REWARD_PAINT_ID : null">Cinnamon</span>
					<span class="seventv-migration-notice-kind"> paint</span>
				</span>
			</div>
		</div>
		<a
			class="seventv-migration-notice-action"
			href="https://7tv.app/migrate"
			target="_blank"
			rel="noopener noreferrer"
			@click="notice.startMigration()"
		>
			Continue on 7tv.app
		</a>
		<button
			class="seventv-migration-notice-dismiss"
			type="button"
			aria-label="Dismiss subscription update notice"
			@click="notice.dismiss()"
		>
			<CloseIcon />
		</button>
	</section>
</template>
<script setup lang="ts">
import { watchEffect } from "vue";
import CloseIcon from "@/assets/svg/icons/CloseIcon.vue";
import { REWARD_BADGE_ID, REWARD_PAINT_ID, subscriptionMigrationNotice as notice } from "./subscriptionMigrationNotice";

const badgeUrl = `https://cdn.7tv.app/badge/${REWARD_BADGE_ID}/4x`;

watchEffect(() => notice.visible && notice.loadRewardPaint());
</script>
<style scoped lang="scss">
.seventv-migration-notice {
	position: relative;
	display: grid;
	grid-template-columns: auto minmax(0, 1fr) auto;
	align-items: center;
	gap: 1rem;
	padding: 1rem 3.5rem 1rem 1.25rem;
	border-top: 0.1rem solid var(--seventv-primary);
	border-bottom: 0.1rem solid var(--seventv-border-transparent-1);
	background-color: var(--seventv-background-shade-3);

	.seventv-migration-notice-badge img {
		display: block;
		width: 4.8rem;
		height: 4.8rem;
	}

	.seventv-migration-notice-copy {
		display: grid;
		gap: 0.5rem;
		min-width: 0;

		> strong {
			color: var(--seventv-text-color-normal);
			font-size: 1.3rem;
		}

		> p {
			margin: 0;
			color: var(--seventv-text-color-secondary);
			line-height: 1.35;
		}
	}

	.seventv-migration-notice-rewards {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 1.5rem;
		font-size: 1.3rem;
		font-weight: 600;
	}

	.seventv-migration-notice-kind {
		color: var(--seventv-text-color-secondary);
		font-weight: 400;
	}

	.seventv-migration-notice-action {
		padding: 0.6rem 1rem;
		border-radius: 0.25rem;
		background-color: var(--seventv-primary);
		color: var(--seventv-background-shade-1);
		font-weight: 600;
		white-space: nowrap;
		text-decoration: none;

		&:hover {
			filter: brightness(0.85);
		}
	}

	.seventv-migration-notice-dismiss {
		all: unset;
		cursor: pointer;
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		display: grid;
		place-items: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 0.25rem;
		color: var(--seventv-text-color-secondary);

		&:hover {
			background-color: var(--seventv-highlight-neutral-1);
			color: var(--seventv-text-color-normal);
		}

		> svg {
			width: 1.25rem;
			height: 1.25rem;
		}
	}
}
</style>
