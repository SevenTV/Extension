<template>
	<div class="seventv-tray">
		<div class="header">
			<span class="logo">
				<Logo provider="7TV" class="icon" />
			</span>
			<div class="page-buttons">
				<div class="header-button" :disabled="page === 1" @click="page--"><text> &lt; </text></div>
				<div class="header-button" :disabled="page === maxPage" @click="page++"><text> &gt; </text></div>
			</div>
			<span class="text" :class="{ notice }">
				{{ notice === "" ? search : notice }}
			</span>
			<div class="alias-button">
				<div
					v-if="hideAlias"
					class="header-button"
					@click="
						() => {
							hideAlias = false;
							nextTick(() => aliasRef?.focus());
						}
					"
				>
					...
				</div>
				<input
					v-show="!hideAlias"
					ref="aliasRef"
					v-model="alias"
					placeholder="alias"
					:invalid="invalidAlias"
					@focusout="alias === '' && (hideAlias = true)"
				/>
			</div>
			<span class="header-button" :onclick="() => resolve({})">
				<TwClose />
			</span>
		</div>
		<div class="body">
			<UiScrollable v-if="!query.loading.value">
				<div class="emote-view" :invalidAlias="invalidAlias">
					<template v-if="result?.emotes.count">
						<template v-for="emote of result?.emotes.items" :key="emote.id">
							<Emote
								:emote="{ id: emote.id, name: emote.name, data: emote, provider: '7TV' }"
								with-border
								class="emote-with-border"
								:zero-width="!!(emote?.flags ?? 0 & 256)"
								:enabled="isEnabled(emote)"
								:conflict="isConflict(emote)"
								@emote-click="(e) => onClick(e, emote)"
							/>
						</template>
					</template>
					<div v-else class="no-emotes">
						<text>
							{{ `Could not find any emotes when searching for: ${search}` }}
						</text>
					</div>
				</div>
			</UiScrollable>
			<div v-else class="loading-spinner">
				<ppL />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, toRef, watch } from "vue";
import { refAutoReset } from "@vueuse/core";
import { searchQuery } from "@/assets/gql/seventv.user.gql";
import ppL from "@/assets/svg/icons/ppL.vue";
import Logo from "@/assets/svg/logos/Logo.vue";
import TwClose from "@/assets/svg/twitch/TwClose.vue";
import Emote from "@/app/chat/Emote.vue";
import UiScrollable from "@/ui/UiScrollable.vue";
import { useQuery } from "@vue/apollo-composable";

const emoteNameRegex = new RegExp("^[-_A-Za-z():0-9]{2,100}$");

const props = defineProps<{
	close: () => void;
	search: string;
	set?: SevenTV.EmoteSet;
	resolve: (res: Twitch.ChatCommand.AsyncResult) => void;
	onEmoteClick: (e: MouseEvent, id: string, alias?: string) => void;
}>();

const pageSize = 64;

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
	limit: pageSize,
	sort: {
		order: "DESCENDING",
		value: "popularity",
	},
};

const onClick = (e: MouseEvent, emote: SevenTV.Emote) => {
	if (invalidAlias.value) {
		notice.value = "Invalid alias";
		return;
	}

	if (isEnabled(emote)) {
		notice.value = "Already enabled";
		return;
	}

	if (isConflict(emote)) {
		notice.value = "Name conflict";
		return;
	}

	props.onEmoteClick(e, emote.id, alias.value !== "" ? alias.value : undefined);
};

const query = useQuery<{ emotes: { count: number; items: SevenTV.Emote[] } }>(searchQuery, variables);
const result = toRef(query, "result");

const notice = refAutoReset("", 3000);

const alias = ref("");
const aliasRef = ref<HTMLInputElement | null>(null);
const hideAlias = ref(true);

const invalidAlias = computed(
	() =>
		(alias.value !== "" ? !emoteNameRegex.test(alias.value) : false) ||
		props.set?.emotes.find((e) => e.name === alias.value) !== undefined,
);

const page = ref(1);
const maxPage = computed(() => (result.value ? Math.ceil(result.value?.emotes.count / pageSize) : 1));

const isEnabled = (emote: SevenTV.Emote) => {
	return !!props.set?.emotes.find((e) => e.id === emote.id);
};

const isConflict = (emote: SevenTV.Emote) => {
	return !!props.set?.emotes.find((e) => e.name === (alias.value === "" ? emote.name : alias.value));
};

const resolveError = () => {
	return props.resolve({
		notice: "Could not find any emotes named: " + props.search,
		error: "variable_error",
	});
};

watch(
	() => props.search,
	() => {
		page.value = 1;
	},
);

watch([() => props.search, page], () => {
	query.loading.value = true;
	query.refetch({ ...variables, query: props.search, page: page.value });
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
		padding: 0.2rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--color-border-base);
		gap: 0.2em;
		min-width: 0;

		.logo {
			height: 3em;
			width: 3em;
			padding: 0.5rem;
		}

		svg {
			width: 2em;
			height: 2em;
		}

		.text {
			color: var(--color-text-alt);
			font-weight: var(--font-weight-semibold);
			font-size: 1.6rem;
			white-space: nowrap;
			text-overflow: ellipsis;
			flex-grow: 1;
			text-align: center;
			overflow: hidden;
			width: auto;
			margin: auto;
		}

		.notice {
			color: rgb(220, 100, 100);
			text-decoration: underline;
		}

		.page-buttons {
			height: 3rem;
			display: flex;
			max-width: 100%;
			align-items: center;
			justify-content: left;

			text {
				vertical-align: middle;
				display: flex;
				justify-content: center;
				margin-top: -0.5rem;
				font-size: 1.8rem;
			}
		}

		.alias-button {
			height: 3rem;
			width: 6rem;
			display: flex;
			align-items: center;
			justify-content: end;
			flex-shrink: 1;

			input {
				width: 5em;
				height: 2em;
				font-size: 1.2rem;
				border: 0.1rem solid var(--color-border-input);
				border-radius: 0.25rem;
				background-color: var(--color-background-input);
				padding: 0.5rem;

				color: var(--color-text-base);

				&[invalid="true"] {
					border-color: red !important;
					outline-color: red !important;
				}
			}
		}

		.header-button {
			border-radius: 0.5rem;
			width: 3em;
			height: 3em;
			cursor: pointer;
			text-align: center;
			padding: 0.5em;

			&:hover {
				background-color: var(--color-background-button-text-hover);
			}

			&[disabled="true"] {
				background-color: none;
				opacity: 0.5;
				pointer-events: none;
			}
		}
	}
	.body {
		height: 26em;
		display: flex;

		.emote-view {
			display: flex;
			font-size: 1rem;
			flex-wrap: wrap;
			margin: 0.5em 0;
			padding-top: 0.5em;

			.emote-with-border {
				&[zero-width="true"] {
					border: 0.1rem solid rgb(220, 170, 50);
				}
				&[conflict="true"] {
					border: 0.1rem solid rgb(220, 50, 50);
				}
				&[enabled="true"] {
					border: 0.1rem solid rgb(50, 220, 50);
				}
			}

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
			margin: auto;
			display: flex;
			flex-grow: 1;
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
}
</style>
