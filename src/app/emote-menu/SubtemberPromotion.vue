<template>
	<div class="seventv-promotion-subtember">
		<div>
			<p class="header">Get exclusive cosmetics and emotes!</p>
			<p class="description">Gift 3+ 7TV subs to unlock exclusive cosmetics for a limited time</p>
		</div>

		<div>
			<div class="perks">
				<div>
					<p class="title">Unique fantasy-themed chat emotes</p>
					<div class="contents contents-emoteset">
						<Emote v-for="emote of EMOTES" :key="emote.id" :emote="emote" class="emote" />
					</div>
				</div>
				<div>
					<p class="title">Exclusive paint & badge</p>
					<div class="contents contents-cosmetics">
						<Badge type="app" :alt="BADGE_DATA.data.tooltip" :badge="BADGE_DATA" class="badge-demo" />
						<p
							v-tooltip="`Paint: ${PAINT_DATA.data.name}`"
							v-cosmetic-paint="'INTERNAL#subtember2023-promo-paint'"
							class="paint-demo"
						>
							{{ actor.user?.display_name ?? "Username" }}
						</p>
					</div>
				</div>
			</div>
		</div>

		<p class="disclaimer">Offer expires October 3rd</p>

		<StoreLinkButton type="generic" />
	</div>
</template>

<script setup lang="ts">
import { useActor } from "@/composable/useActor";
import { updatePaintStyle } from "@/composable/useCosmetics";
import Badge from "@/app/chat/Badge.vue";
import Emote from "@/app/chat/Emote.vue";
import StoreLinkButton from "@/app/store/StoreLinkButton.vue";

const actor = useActor();

const PAINT_DATA: SevenTV.Cosmetic<"PAINT"> = {
	id: "INTERNAL#subtember2023-promo-paint",
	kind: "PAINT",
	provider: "7TV",
	data: {
		name: "Spellcaster",
		function: "URL",
		color: 0,
		angle: 90,
		shape: "circle",
		image_url: "https://cdn.discordapp.com/attachments/982349327429173249/1149026602123010058/magic2blurry.webp",
		repeat: false,
		stops: [],
		shadows: [
			{
				x_offset: 0,
				y_offset: 0,
				radius: 0.1,
				color: 11796479,
			},
		],
		gradients: [],
	},
};

updatePaintStyle(PAINT_DATA);

const BADGE_DATA: SevenTV.Cosmetic<"BADGE"> = {
	id: "INTERNAL#subtember2023-promo-badge",
	kind: "BADGE",
	provider: "7TV",
	data: {
		name: "Subtember 2023 Gifter",
		tooltip: "Subtember 2023 Gifter",
		host: {
			url: "//cdn.discordapp.com/attachments/982349327429173249/1148718719145627739/",
			files: [
				{
					name: "image.png",
					format: "PNG",
				},
			],
		},
	},
};

const EMOTES: SevenTV.ActiveEmote[] = [
	{
		id: "64e3d3a3c8f688f85645161f",
		name: "fantasyLute",
		data: {
			id: "64e3d3a3c8f688f85645161f",
			name: "fantasyLute",
			host: {
				url: "//cdn.7tv.app/emote/64e3d3a3c8f688f85645161f",
				files: [
					{
						name: "1x.avif",
						format: "AVIF",
					},
					{
						name: "1x.webp",
						format: "WEBP",
					},
					{
						name: "2x.avif",
						format: "AVIF",
					},
					{
						name: "2x.webp",
						format: "WEBP",
					},
					{
						name: "3x.avif",
						format: "AVIF",
					},
					{
						name: "3x.webp",
						format: "WEBP",
					},
					{
						name: "4x.avif",
						format: "AVIF",
					},
					{
						name: "4x.webp",
						format: "WEBP",
					},
				],
			},
			owner: null,
		},
	},
	{
		id: "64e3bd97962e89af7f7f2433",
		name: "fantasyDank",
		data: {
			id: "64e3bd97962e89af7f7f2433",
			name: "fantasyDank",
			host: {
				url: "//cdn.7tv.app/emote/64e3bd97962e89af7f7f2433",
				files: [
					{
						name: "1x.avif",
						format: "AVIF",
					},
					{
						name: "1x.webp",
						format: "WEBP",
					},
					{
						name: "2x.avif",
						format: "AVIF",
					},
					{
						name: "2x.webp",
						format: "WEBP",
					},
					{
						name: "3x.avif",
						format: "AVIF",
					},
					{
						name: "3x.webp",
						format: "WEBP",
					},
					{
						name: "4x.avif",
						format: "AVIF",
					},
					{
						name: "4x.webp",
						format: "WEBP",
					},
				],
			},
			owner: null,
		},
	},
	{
		id: "64e3bc9a82b326506ad7eb07",
		name: "fantasySure",
		data: {
			id: "64e3bc9a82b326506ad7eb07",
			name: "fantasySure",
			host: {
				url: "//cdn.7tv.app/emote/64e3bc9a82b326506ad7eb07",
				files: [
					{
						name: "1x.avif",
						format: "AVIF",
					},
					{
						name: "1x.webp",
						format: "WEBP",
					},
					{
						name: "2x.avif",
						format: "AVIF",
					},
					{
						name: "2x.webp",
						format: "WEBP",
					},
					{
						name: "3x.avif",
						format: "AVIF",
					},
					{
						name: "3x.webp",
						format: "WEBP",
					},
					{
						name: "4x.avif",
						format: "AVIF",
					},
					{
						name: "4x.webp",
						format: "WEBP",
					},
				],
			},
			owner: null,
		},
	},
	{
		id: "64e3bb62e4d325845e86eb66",
		name: "fantasyHmm",
		data: {
			id: "64e3bb62e4d325845e86eb66",
			name: "fantasyHmm",
			host: {
				url: "//cdn.7tv.app/emote/64e3bb62e4d325845e86eb66",
				files: [
					{
						name: "1x.avif",
						format: "AVIF",
					},
					{
						name: "1x.webp",
						format: "WEBP",
					},
					{
						name: "2x.avif",
						format: "AVIF",
					},
					{
						name: "2x.webp",
						format: "WEBP",
					},
					{
						name: "3x.avif",
						format: "AVIF",
					},
					{
						name: "3x.webp",
						format: "WEBP",
					},
					{
						name: "4x.avif",
						format: "AVIF",
					},
					{
						name: "4x.webp",
						format: "WEBP",
					},
				],
			},
			owner: null,
		},
	},
];
</script>

<style lang="scss" scoped>
.seventv-promotion-subtember {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	align-items: center;
	text-align: center;
	margin: 0.5em 1.4em;

	p,
	span {
		font-size: 1.1em;
	}

	.header {
		font-size: 1.4em;
		font-weight: bold;
	}

	.description {
		color: var(--seventv-muted);
	}

	.perks-header {
		align-self: start;
		text-align: left;
		font-size: 1.25em;
		font-weight: bold;
	}

	.disclaimer {
		align-self: end;
		text-align: right;
		font-size: 0.9em;
		color: var(--seventv-muted);
	}

	button {
		font-size: 1.5em;
	}
}

.perks {
	display: grid;
	grid-auto-flow: column;
	grid-auto-columns: minmax(0, 1fr);
	gap: 0.5rem;

	> div {
		width: 100%;
		max-width: 100%;
		text-align: left;
		padding: 0.25rem;
	}

	.title {
		color: var(--seventv-muted);
	}

	.contents {
		padding: 0.5rem;
		border-radius: 0.5rem;
		background-color: var(--seventv-background-shade-3);
	}

	.contents-emoteset {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;

		.emote {
			width: 2.5rem;
		}
	}

	.contents-cosmetics {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;

		.paint-demo {
			font-size: 1.4em;
			max-width: 100%;
			text-overflow: ellipsis;
			overflow: hidden;
		}

		.badge-demo {
			width: 1.8em;
			height: 1.8em;
		}
	}
}
</style>
