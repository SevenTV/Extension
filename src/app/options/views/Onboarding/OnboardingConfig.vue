<template>
	<main class="onboarding-config">
		<div class="header">
			<h1 v-t="'onboarding.config_title'" />
			<p v-t="'onboarding.config_subtitle'" />
		</div>

		<div class="settings">
			<div v-if="!acknowledgements.has('new-chat')" class="new-chat-advisory">
				<strong v-t="'onboarding.config_new_chat_advisory'" />
				<span v-t="'onboarding.config_emphasize-bad-compat'" class="emphasize-bad-compat" />
				<div>
					<p v-t="'onboarding.config_bear_with_us1'" />
					<a v-t="'onboarding.config_bear_with_us2'" href="https://discord.gg/7tv" target="_blank" />
				</div>

				<span></span>

				<UiButton class="ui-button-important" @click="[acknowledgements.add('new-chat'), setLock(false)]">
					<template #icon>
						<GearsIcon />
					</template>
					<span v-t="'onboarding.config_action_button'" />
				</UiButton>
			</div>

			<Transition v-else name="question" appear>
				<div v-if="currentQuestion" class="questions">
					<div class="question">
						<h2>{{ currentQuestion.title }}</h2>

						<div v-if="currentQuestion.kind === 'either'" class="options">
							<UiButton @click="onAnswer(currentQuestion!, true)">
								<span v-t="'onboarding.config_answer_button_yes'" />
							</UiButton>
							<UiButton @click="onAnswer(currentQuestion!, false)">
								<span v-t="'onboarding.config_answer_button_no'" />
							</UiButton>
						</div>

						<div
							v-else-if="currentQuestion.kind === 'config' && currentQuestion.configEffect"
							class="config"
						>
							<UiScrollable>
								<SettingsNode
									v-for="node of currentQuestion.configEffect.map((k) => nodes.get(k)!)"
									:key="node.key"
									:node="node"
								/>
							</UiScrollable>

							<UiButton @click="onAnswer(currentQuestion!, true)">
								<span v-t="'onboarding.button_confirm'" />
							</UiButton>
						</div>
					</div>
				</div>
			</Transition>
		</div>
	</main>
</template>

<script setup lang="ts">
const emit = defineEmits<{
	(e: "completed"): void;
}>();

const { t } = useI18n();
const { setCompleted, setLock } = useOnboarding("config");

const settings = useSettings();

const nodes = reactive<Map<string, SevenTV.SettingNode>>(new Map());
const acknowledgements = reactive(new Set<string>([]));

const questions = ref<Question[]>([
	{
		id: "active-chatter",
		kind: "either",
		title: t("onboarding.config_question.chatter"),
		immediateConfigEffect: [
			["highlights.basic.mention_sound", true],
			["highlights.basic.mention_title_flash", true],
		],
	},
	{
		id: "chatter-config-autocompletion",
		kind: "config",
		configEffect: [
			"chat_input.autocomplete.colon",
			"chat_input.autocomplete.colon.emoji",
			"chat_input.autocomplete.carousel",
			"chat_input.autocomplete.carousel_arrow_keys",
			"chat_input.autocomplete.chatters",
		],
		title: t("onboarding.config_question.chatter_autocompletion"),
		if: ["active-chatter"],
	},
	{
		id: "chatter-config-look",
		kind: "config",
		configEffect: [
			"chat.message_batch_duration",
			"chat.smooth_scroll_duration",
			"chat.line_limit",
			"chat.alternating_background",
			"chat.padding",
			"chat.colored_mentions",
		],
		title: t("onboarding.config_question.chatter_look"),
		if: ["active-chatter"],
	},
	{
		id: "chatter-config-ping",
		kind: "config",
		configEffect: ["highlights.basic.mention_title_flash", "highlights.basic.mention_sound"],
		title: t("onboarding.config_question.chatter_ping"),
		if: ["active-chatter"],
	},
	{
		id: "chatter-config-spam",
		kind: "config",
		configEffect: [
			"general.autoclaim.channel_points",
			"chat_input.spam.bypass_duplicate",
			"chat_input.spam.rapid_fire_send",
		],
		title: t("onboarding.config_question.chatter_spam"),
		if: ["active-chatter"],
	},
	{
		id: "moderator",
		kind: "either",
		title: t("onboarding.config_question.moderator"),
	},
	{
		id: "moderator-config",
		kind: "config",
		title: t("onboarding.config_question.moderator_utility"),
		if: ["moderator"],
		configEffect: ["chat.mod_slider"],
	},
	{
		id: "streamer",
		kind: "either",
		title: t("onboarding.config_question.streamer"),
		immediateConfigEffect: [
			// turn off ping effects if user is a streamer
			["general.blur_unlisted_emotes", true],
			["chat.message_batch_duration", 350],
			["highlights.basic.mention_title_flash", false],
			["highlights.basic.mention_sound", false],
		],
	},
	{
		id: "streamer-config",
		kind: "config",
		title: t("onboarding.config_question.streamer_utility"),
		if: ["streamer"],
		configEffect: [
			"general.blur_unlisted_emotes",
			"chat.message_batch_duration",
			"chat.smooth_scroll_duration",
			"highlights.basic.mention_title_flash",
			"highlights.basic.mention_sound",
		],
	},
]);
const currentQuestion = ref<Question | null>(questions.value[0]);

function onAnswer(q: Question, v: boolean): void {
	if (q) {
		q.answer = v;
	}

	currentQuestion.value = null;

	if (v && q.immediateConfigEffect?.length) {
		for (const [k, val] of q.immediateConfigEffect) {
			const cfg = useConfig(k);
			if (!cfg) continue;

			cfg.value = val;
		}
	}

	useTimeoutFn(() => {
		let n: Question | undefined;
		let i = -1;

		for (;;) {
			i++;

			n = questions.value[questions.value.indexOf(q) + (i + 1)];
			if (!n) break;

			let shouldContinue = false;
			for (const i of n.if ?? []) {
				const q = questions.value.find((q) => q.id === i);
				if (!q) continue;

				if (q.answer === false) shouldContinue = true;
			}

			if (shouldContinue) continue;
			break;
		}

		if (!n) {
			emit("completed");
			setLock(false);
			setCompleted(true);
		}

		currentQuestion.value = n;
	}, 500);
}

const allModules = import.meta.glob("@/site/**/modules/**/*Module.vue", {
	eager: false,
	import: "config",
});
for (const loader of Object.values(allModules)) {
	(loader as () => Promise<SevenTV.SettingNode[]>)().then((a) => {
		if (!Array.isArray(a)) return;

		settings.register(a);
		for (const n of a) {
			nodes.set(n.key, n);
		}
	});
}

interface Question {
	id: string;
	title: string;
	kind: "either" | "config";
	if?: string[];
	configEffect?: string[];
	immediateConfigEffect?: [string, SevenTV.SettingType][];
	answer?: boolean | string | number;
}
</script>

<script lang="ts">
import { reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useTimeoutFn } from "@vueuse/shared";
import { useConfig, useSettings } from "@/composable/useSettings";
import GearsIcon from "@/assets/svg/icons/GearsIcon.vue";
import { OnboardingStepRoute, useOnboarding } from "./Onboarding";
import SettingsNode from "@/app/settings/SettingsNode.vue";
import UiButton from "@/ui/UiButton.vue";
import UiScrollable from "@/ui/UiScrollable.vue";

export const step: OnboardingStepRoute = {
	name: "config",
	order: 2,
};
</script>

<style scoped lang="scss">
// q animation
.question-enter-active,
.question-leave-active {
	transition: transform 270ms cubic-bezier(0.48, 1.29, 0, -1.57), opacity 300ms;
}

.question-enter-from,
.question-leave-to {
	transform: translateY(1rem);
	opacity: 0.5;
}

main {
	display: grid;
	width: 100%;
	grid-template-rows: max-content 1fr;
	grid-template-areas:
		"header"
		"settings";

	.header {
		grid-area: header;
		justify-self: center;
		align-self: center;
		text-align: center;
		max-width: 60vw;
		border-bottom: 0.25rem solid var(--seventv-muted);

		h1 {
			font-size: max(1rem, 3vw);
		}

		p {
			font-size: max(1rem, 1vw);
		}
	}

	.settings {
		grid-area: settings;
		justify-self: center;
		align-self: center;
		display: grid;
		margin-bottom: 15%;
		padding: 1rem;
		border-radius: 0.25em;

		.new-chat-advisory {
			margin: 0 5%;
			padding: 5vw 0;
			text-align: center;
			font-size: max(1rem, 2vw);
			display: grid;
			justify-items: center;
			gap: 1em;

			button {
				font-size: 2vw;
				padding: 0 2vw;
				width: max-content;
			}

			a {
				cursor: pointer;
				color: var(--seventv-accent);

				&:hover {
					text-decoration: underline;
				}
			}

			.emphasize-bad-compat {
				font-style: italic;
			}
		}

		.questions {
			text-align: center;
			font-size: max(1rem, 2vw);
			display: grid;
			gap: 1em;
			align-items: center;

			.question {
				display: grid;
				gap: 0.25em;

				h2 {
					font-size: max(1rem, 1.25vw);
				}

				border-radius: 0.25rem;

				.config {
					background-color: var(--seventv-background-shade-2);
					border-radius: 0.25rem;
					outline: 0.1rem solid var(--seventv-input-border);
					display: grid;
					gap: 1em;
					font-size: 1rem;
					text-align: start;
					max-height: 50vh;
					margin: 0 15vw;

					button {
						font-size: 2vw;
					}
				}

				.options {
					display: flex;
					justify-content: flex-end;
					align-self: center;
					align-content: center;
					gap: 1em;
					grid-template-columns: repeat(2, 1fr);

					button {
						max-width: 6vw;

						&:hover {
							outline-width: 0.15rem;
						}
					}

					:nth-child(1) {
						outline-color: rgba(128, 255, 128, 25%);
					}

					:nth-child(2) {
						outline-color: rgba(255, 128, 128, 25%);
					}
				}
			}

			.progress {
				font-size: 1vw;
				color: var(--seventv-muted);
			}
		}
	}
}
</style>
