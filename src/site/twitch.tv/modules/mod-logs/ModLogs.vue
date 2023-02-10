<template>
	<main class="seventv-mod-logs-container">
		<div ref="handle" class="seventv-mod-logs-header">
			<ModLogsIcon />
			<h3>Mod Logs</h3>

			<button @click="emit('close')">
				<TwClose />
			</button>
		</div>

		<div class="seventv-mod-logs-content">
			<div class="seventv-mod-logs-sidebar">
				<template v-for="(t, id) in tabs" :key="id">
					<div
						v-if="t.com"
						class="seventv-mod-logs-sidebar-button"
						:selected="t.id === activeTabID"
						:unavailable="!risksAcknowledged"
						@click="() => (activeTabID = t.id as TabID)"
					>
						<component :is="t.icon" />
					</div>
				</template>
			</div>

			<UiScrollable>
				<div class="seventv-mod-logs-body">
					<template v-if="!risksAcknowledged">
						<div class="seventv-mod-logs-risks">
							<p class="seventv-mod-logs-risks-heads-up">
								<WarningIcon />
								<span>HEADS UP!</span>
							</p>
							<span>
								The content displayed by this tool is unfiltered and contains potentially harmful or
								offensive material that has been blocked by the channel moderators. Are you sure you
								want to proceed?
							</span>

							<div class="seventv-mod-logs-risks-choice">
								<button class="decide-ack" @click="makeRiskDecision(true)">
									Acknowledge and Proceed
								</button>
								<button class="decide-close" @click="makeRiskDecision(false)">Close</button>
								<label>(You can re-enable this feature via the settings later)</label>
							</div>
						</div>
					</template>

					<template v-else-if="activeTab">
						<p>
							<component :is="activeTab.icon" />
							<span>{{ activeTab.name }}</span>
						</p>
						<component :is="activeTab.com" />
					</template>
				</div>
			</UiScrollable>
		</div>
	</main>
</template>

<script setup lang="ts">
import { computed, markRaw, reactive, ref } from "vue";
import { watchArray } from "@vueuse/shared";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatMessages } from "@/composable/chat/useChatMessages";
import { useConfig } from "@/composable/useSettings";
import BanIcon from "@/assets/svg/icons/BanIcon.vue";
import ModLogsIcon from "@/assets/svg/icons/ModLogsIcon.vue";
import SwordIcon from "@/assets/svg/icons/SwordIcon.vue";
import TimerIcon from "@/assets/svg/icons/TimerIcon.vue";
import WarningIcon from "@/assets/svg/icons/WarningIcon.vue";
import TwClose from "@/assets/svg/twitch/TwClose.vue";
import ModLogsAuthorityMessages from "./ModLogsAuthorityMessages.vue";
import ModLogsRecentActions from "./ModLogsRecentActions.vue";
import { useModLogsStore } from "./ModLogsStore";
import UiScrollable from "@/ui/UiScrollable.vue";

const props = defineProps<{
	channelId: string;
}>();

const emit = defineEmits<{
	(e: "close"): void;
}>();

const ctx = useChannelContext(props.channelId);
const messages = useChatMessages(ctx);
const localStore = useModLogsStore();

const handle = ref<HTMLDivElement | undefined>();
const isEnabled = useConfig<boolean>("chat.mod_logs.enabled");
const risksAcknowledged = useConfig<boolean>("chat.mod_logs.ack_risks");

const activeTabID = ref<TabID>("recent-actions");
const activeTab = computed(() => tabs[activeTabID.value] ?? null);
const tabs = reactive({
	"recent-actions": {
		id: "recent-actions",
		name: "Recent Timeouts/Bans",
		icon: markRaw(BanIcon),
		com: markRaw(ModLogsRecentActions),
	},
	"active-actions": {
		id: "active-actions",
		name: "Active Timeouts/Bans",
		icon: markRaw(TimerIcon),
		com: void 0,
	},
	"moderator-messages": {
		id: "moderator-messages",
		name: "Moderator Messages",
		icon: markRaw(SwordIcon),
		com: markRaw(ModLogsAuthorityMessages),
	},
});
type TabID = keyof typeof tabs;

function makeRiskDecision(choice: boolean) {
	risksAcknowledged.value = choice;
	isEnabled.value = choice;

	if (!choice) emit("close");
}

watchArray(messages.displayed, (a, b, added) => {
	for (const item of added) {
		if (!("moderator" in item.badges || "broadcaster" in item.badges || "staff" in item.badges)) continue;

		localStore.modMessages.unshift(item);
	}

	if (localStore.modMessages.length > 200) localStore.modMessages.length = 150;
});

defineExpose({
	handle,
});
</script>

<style scoped lang="scss">
main.seventv-mod-logs-container {
	background: var(--seventv-background-transparent-1);
	backdrop-filter: blur(0.25em);
	outline: 0.01rem solid var(--seventv-border-transparent-1);
	border-radius: 0.25rem;
}
.seventv-mod-logs-header {
	cursor: move;
	display: grid;
	grid-template-columns: 4rem 1fr auto;
	column-gap: 0.5em;
	align-items: center;
	background: var(--seventv-background-transparent-2);
	border-bottom: 0.01rem solid var(--seventv-border-transparent-1);

	padding: 0.5rem 0.75rem;

	> svg {
		padding: 0.35rem;
	}

	> button {
		display: grid;
		align-items: center;
		font-size: 3rem;
		border-radius: 0.25rem;

		&:hover {
			background: hsla(0deg, 0%, 30%, 32%);
		}
	}
}

.seventv-mod-logs-content {
	display: grid;
	grid-template-columns: 4em auto;
}
.seventv-mod-logs-sidebar {
	border-right: 0.1rem solid var(--seventv-border-transparent-1);
	display: grid;
	place-items: center;
	padding: 1em 0;
	row-gap: 1em;

	.seventv-mod-logs-sidebar-button {
		display: grid;
		align-items: center;
		justify-content: center;
		width: 4rem;
		height: 4rem;
		background: hsla(0deg, 0%, 30%, 0.06%);
		border-radius: 0.25rem;

		> svg {
			font-size: 2em;
		}

		&:hover,
		&[selected="true"] {
			cursor: pointer;
			background: hsla(0deg, 0%, 30%, 0.25%);
		}

		&[unavailable="true"] {
			opacity: 0.5;
			pointer-events: none;
		}
	}
}

.seventv-mod-logs-body {
	width: 27.5rem;
	height: 36rem;

	> p {
		text-align: center;
		font-size: 1.35rem;
		font-weight: 600;
		border-bottom: 0.1rem solid var(--seventv-border-transparent-1);
		padding: 0.25rem 0;

		> svg,
		span {
			margin: 0 0.25em;
			display: inline-block;
			vertical-align: middle;
		}
	}

	.seventv-mod-logs-risks {
		display: grid;
		width: 100%;
		padding: 1rem;

		> p.seventv-mod-logs-risks-heads-up {
			display: flex;
			font-size: 3rem;
			font-weight: 600;
			align-items: center;
			justify-self: center;
			column-gap: 0.5em;
			color: var(--seventv-warning);
		}

		> span {
			font-size: 1.25rem;
			font-weight: 600;
			text-align: center;
			border-bottom: 0.1rem solid var(--seventv-border-transparent-1);
			padding: 0.25rem 0;
		}

		.seventv-mod-logs-risks-choice {
			margin-top: 1em;
			display: grid;
			justify-content: center;
			text-align: center;
			row-gap: 1em;

			> label {
				text-align: center;
				font-size: 0.85rem;
				font-weight: 600;
				visibility: hidden;
				color: var(--seventv-muted);
			}

			> button {
				font-size: 1.35rem;
				padding: 0.25rem 0.5rem;
				outline: 0.25rem solid var(--seventv-muted);
				border-radius: 0.15rem;

				&:hover {
					outline-color: currentColor;
				}

				&.decide-close:hover ~ label {
					visibility: visible;
				}
			}
		}
	}
}
</style>
