<template>
	<div class="seventv-tray">
		<div class="header">
			<span class="logo">
				<Logo provider="7TV" class="icon" />
			</span>
			<span class="text">
				<text v-if="query.loading.value"> Loading </text>
				<text v-else> Click to enable </text>
			</span>
			<span class="close" :onclick="close">
				<TwClose />
			</span>
		</div>
		<div v-if="!query.loading.value" class="body">
			<template v-if="result?.emotes.count">
				<template v-for="emote of result?.emotes.items" :key="emote.id">
					<div
						class="seventv-emote-container"
						:ratio="determineRatio({ id: emote.id, name: emote.name, data: emote, provider: '7TV' })"
						:onclick="(e: MouseEvent) => onEmoteClick(e, emote.id)"
						:zero-width="(emote.flags || 0 & 256) !== 0"
					>
						<Emote :emote="{ id: emote.id, name: emote.name, data: emote, provider: '7TV' }" />
					</div>
				</template>
			</template>
			<div v-else class="no-emotes">
				<text>
					{{ `Could not find any emotes when searching for: ${search}` }}
				</text>
			</div>
		</div>
		<div v-else class="loading-spinner">
			<ppL />
		</div>
	</div>
</template>

<script setup lang="ts">
import { toRef, watch } from "vue";
import { determineRatio } from "@/common/Image";
import { searchQuery } from "@/assets/gql/seventv.user.gql";
import ppL from "@/assets/svg/icons/ppL.vue";
import Logo from "@/assets/svg/logos/Logo.vue";
import TwClose from "@/assets/svg/twitch/TwClose.vue";
import Emote from "@/app/chat/Emote.vue";
import { useQuery } from "@vue/apollo-composable";

const props = defineProps<{
	search: string;
	resolve: (res: { notice: string; error?: string }) => void;
	onEmoteClick: (e: MouseEvent, id: string) => void;
	close: () => void;
}>();

const variables = {
	query: props.search,
	filter: {
		animated: false,
		aspect_ratio: "",
		case_sensitive: false,
		category: "TOP",
		exact_match: false,
		ignore_tags: false,
		zero_width: false,
	},
	page: 1,
	limit: 32,
	sort: {
		order: "DESCENDING",
		value: "popularity",
	},
};

const query = useQuery<{ emotes: { count: number; items: SevenTV.Emote[] } }>(searchQuery, variables);

const result = toRef(query, "result");

const resolveError = () => {
	props.close();
	return props.resolve({
		notice: "Could not find any emotes named: " + props.search,
		error: "variable_error",
	});
};

watch(props, () => {
	query.loading.value = true;
	query.refetch({ ...variables, query: props.search });
});

query.onError(resolveError);
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

		.no-emotes {
			margin: 2em;
			font-size: 1.5rem;
		}
	}

	.loading-spinner {
		display: flex;
		justify-content: center;
		padding: 5em;
		padding-left: 0;

		svg {
			animation: pp-circle linear infinite;
			animation-duration: 0.5s;
			transform-origin: 4em;
			width: 2em;
			height: 2em;
		}
	}

	@keyframes pp-circle {
		from {
			transform: rotateZ(-360deg);
		}

		to {
			transform: rotateZ(0deg);
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
