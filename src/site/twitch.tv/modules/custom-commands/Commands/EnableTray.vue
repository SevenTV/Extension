<template>
	<div className="seventv-tray">
		<div className="header">
			<span className="logo">
				<Logo provider="7TV" class="icon" />
			</span>
			<span className="text">
				<text> Click to enable </text>
			</span>
			<span className="close" :onclick="onClose">
				<TwClose />
			</span>
		</div>
		<div className="body">
			<template v-for="emote of emotes" :key="emote.id">
				<div
					class="seventv-emote-container"
					:ratio="determineRatio({ id: emote.id, name: emote.name, data: emote, provider: '7TV' })"
					:onclick="(e: MouseEvent) => onEmoteClick(e, emote.id)"
					:zero-width="(emote.flags || 0 & 256) !== 0"
				>
					<Emote :emote="{ id: emote.id, name: emote.name, data: emote, provider: '7TV' }" />
				</div>
			</template>
		</div>
	</div>
</template>

<script setup lang="ts">
import { determineRatio } from "@/common/Image";
import Logo from "@/assets/svg/logos/Logo.vue";
import TwClose from "@/assets/svg/twitch/TwClose.vue";
import Emote from "@/app/chat/Emote.vue";

defineProps<{
	emotes: SevenTV.Emote[];
	onEmoteClick: (e: MouseEvent, id: string) => void;
	onClose: () => void;
}>();
</script>
<style lang="scss">
.seventv-tray {
	display: block;

	.header {
		max-height: 4em;
		display: flex;
		font-size: 1rem;
		justify-content: space-between;
		padding: 0.2em;
		padding-bottom: 0.5em;
		border-bottom: 1px solid var(--color-border-base);
		margin: 0.2em;

		.logo {
			margin: 0.8rem;
		}

		svg {
			width: 2em;
			height: 2em;
		}

		.text {
			color: var(--color-text-alt) !important;
			word-break: break-word !important;
			font-weight: var(--font-weight-semibold) !important;
			font-size: 1.8rem;
			margin: auto;
		}

		.close {
			border-radius: 0.5rem;
			width: 3em;
			height: 3em;
			cursor: pointer;
			text-align: center;
			padding: 0.5em;

			&:hover {
				background-color: var(--color-background-button-text-hover);
			}
		}
	}

	.body {
		display: flex;
		font-size: 1rem;
		flex-wrap: wrap;
		margin: 0.5em 0;
		padding-top: 0.5em;

		span {
			margin: 0.2em;
			cursor: pointer;
		}
	}
}

.seventv-emote-container {
	display: grid;
	background: hsla(0deg, 0%, 50%, 6%);
	border-radius: 0.25rem;
	height: 4em;
	margin: 0.25em;
	cursor: pointer;

	&:hover {
		background: hsla(0deg, 0%, 50%, 32%);
	}

	&[zero-width="true"] {
		border: 0.1rem solid rgb(220, 170, 50);
	}

	// The extra width is to compensate for the spacing
	// between the emotes so they tile correctly.

	&[ratio="1"] {
		width: 4em;
	}

	&[ratio="2"] {
		width: calc(4em * 1.5 + 0.25em);
	}

	&[ratio="3"] {
		width: calc(4em * 2 + 0.5em);
	}

	&[ratio="4"] {
		width: calc(4em * 3 + 1em);
	}
}
</style>
