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
			<span class="text" :class="notice.type">
				{{ notice.type === "none" ? search : notice.message }}
			</span>
			<Alias v-if="mut.canEditSet" :alias="alias" :invalid="invalidAlias" @update:alias="alias = $event" />
			<div v-else class="padder" />
			<span class="header-button" @click="close">
				<TwClose />
			</span>
		</div>
		<div v-if="mut.needsLogin" class="login-notice">
			<a href="#" @click="openAuthPage"> Authenticate extension to manage emotes </a>
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
import { SEVENTV_EMOTE_NAME_REGEXP } from "@/common/Constant";
import type { SetMutation } from "@/composable/useSetMutation";
import { searchQuery } from "@/assets/gql/seventv.user.gql";
import ppL from "@/assets/svg/icons/ppL.vue";
import Logo from "@/assets/svg/logos/Logo.vue";
import TwClose from "@/assets/svg/twitch/TwClose.vue";
import Emote from "@/app/chat/Emote.vue";
import Alias from "@/app/chat/EmoteAliasButton.vue";
import { useSettingsMenu } from "@/app/settings/Settings";
import UiScrollable from "@/ui/UiScrollable.vue";
import { useQuery } from "@vue/apollo-composable";

const props = defineProps<{
	search: string;
	mut: SetMutation;
}>();

const emit = defineEmits(["close"]);
const close = () => emit("close");

const sCtx = useSettingsMenu();

const pageSize = ref(50);
const exactMatch = ref(false);
const page = ref(1);
const maxPage = computed(() => (result.value ? Math.ceil(result.value?.emotes.count / pageSize.value) : 1));

type Notice = { type: "error" | "info" | "none"; message: string };

const notice = refAutoReset<Notice>({ type: "none", message: "" }, 3000);
const alias = ref("");

const invalidAlias = computed(
	() =>
		(alias.value !== "" ? !SEVENTV_EMOTE_NAME_REGEXP.test(alias.value) : false) ||
		props.mut.set?.emotes.find((e) => e.name === alias.value) !== undefined,
);

const isEnabled = (emote: SevenTV.Emote) => {
	return !!props.mut.set?.emotes.find((e) => e.id === emote.id);
};

const isConflict = (emote: SevenTV.Emote) => {
	if (!props.mut.canEditSet) return false;
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
		navigator.clipboard.writeText(`https://7tv.app/emotes/${emote.id}`);
		notice.value = { type: "info", message: "Copied" };
		return;
	}

	if (isEnabled(emote)) {
		props.mut.remove(emote.id).catch(() => {
			notice.value = { type: "error", message: "Error" };
		});
		return;
	}

	if (invalidAlias.value) {
		notice.value = { type: "error", message: "Invalid alias" };
		return;
	}

	if (isConflict(emote)) {
		notice.value = { type: "error", message: "Name conflict" };
		return;
	}

	const name = alias.value !== "" ? alias.value : emote.name;
	props.mut.add(emote.id, name).catch(() => {
		notice.value = { type: "error", message: "Error" };
	});
	alias.value = "";
};

const openAuthPage = (e: MouseEvent) => {
	e.preventDefault();
	sCtx.open = true;
	sCtx.switchView("profile");
	return false;
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

			&.error {
				color: rgb(220, 100, 100);
				text-decoration: underline;
			}

			&.info {
				color: rgb(100, 220, 100);
				text-decoration: underline;
			}
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
			user-select: none;

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

	.login-notice {
		max-height: 4em;
		display: flex;
		padding: 0.5rem 0.2rem;
		border-bottom: 1px solid var(--color-border-base);
		justify-content: center;
		font-size: 1.2rem;
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
