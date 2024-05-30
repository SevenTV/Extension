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
			<Alias v-if="mut.canEditSet" :alias="alias" :invalid="invalidAlias" @update:alias="alias = $event" />
			<div v-else class="padder" />
			<span class="header-button" @click="close">
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
								@emote-click="onEmoteClick($event, emote)"
							/>
						</template>
					</template>
					<div v-else class="no-emotes">
						<text>Could not find any emotes </text>
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
import { computed, ref, toRef, watch } from "vue";
import { onKeyDown, refAutoReset } from "@vueuse/core";
import type { SetMutation } from "@/composable/useSetMutation";
import { useTooltip } from "@/composable/useTooltip";
import { searchQuery } from "@/assets/gql/seventv.user.gql";
import ppL from "@/assets/svg/icons/ppL.vue";
import Logo from "@/assets/svg/logos/Logo.vue";
import TwClose from "@/assets/svg/twitch/TwClose.vue";
import Alias from "./EmoteAliasButton.vue";
import Emote from "@/app/chat/Emote.vue";
import UiScrollable from "@/ui/UiScrollable.vue";
import { useQuery } from "@vue/apollo-composable";

const emoteNameRegex = new RegExp("^[-_A-Za-z():0-9]{2,100}$");

const props = defineProps<{
	search: string;
	mut: SetMutation;
}>();

const emit = defineEmits(["close"]);
const close = () => emit("close");

const pageSize = ref(64);
const exactMatch = ref(false);
const page = ref(1);
const maxPage = computed(() => (result.value ? Math.ceil(result.value?.emotes.count / pageSize.value) : 1));

const notice = refAutoReset("", 3000);
const alias = ref("");

const invalidAlias = computed(
	() =>
		(alias.value !== "" ? !emoteNameRegex.test(alias.value) : false) ||
		props.mut.set?.emotes.find((e) => e.name === alias.value) !== undefined,
);

const { show, hide } = useTooltip("Emote link copied to clipboard");

const isEnabled = (emote: SevenTV.Emote) => {
	return !!props.mut.set?.emotes.find((e) => e.id === emote.id);
};

const isConflict = (emote: SevenTV.Emote) => {
	return !!props.mut.set?.emotes.find((e) => e.name === (alias.value === "" ? emote.name : alias.value));
};

watch(
	() => props.search,
	() => (page.value = 1),
);

const variables = computed(() => ({
	query: props.search,
	filter: {
		animated: false,
		aspect_ratio: "",
		case_sensitive: false,
		category: "TOP",
		exact_match: exactMatch.value,
		ignore_tags: false,
		zero_width: false,
	},
	page: page.value,
	limit: pageSize.value,
	sort: {
		order: "DESCENDING",
		value: "popularity",
	},
}));

const query = useQuery<{ emotes: { count: number; items: SevenTV.Emote[] } }>(searchQuery, variables);
const result = toRef(query, "result");

onKeyDown("Escape", close);

const onEmoteClick = (e: MouseEvent, emote: SevenTV.Emote) => {
	if (e.ctrlKey) {
		window.open("https://7tv.app/emotes/" + emote.id, "_blank");
		return;
	}

	if (!props.mut.canEditSet) {
		show(e.target as HTMLElement);
		navigator.clipboard.writeText(`https://7tv.app/emotes/${emote.id}`);
		setTimeout(hide, 2000);
		return;
	}

	if (isEnabled(emote)) {
		props.mut.remove(emote.id);
		if (!e.shiftKey) close();
		return;
	}

	if (invalidAlias.value) {
		notice.value = "Invalid alias";
		return;
	}

	if (isConflict(emote)) {
		notice.value = "Name conflict";
		return;
	}

	const name = alias.value !== "" ? alias.value : emote.name;
	props.mut.add(emote.id, name);
	alias.value = "";

	if (!e.shiftKey) close();
};
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

		.padder {
			max-width: 6em;
			display: flex;
			flex-grow: 1;
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
