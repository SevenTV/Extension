<template>
	<div v-if="ready" class="seventv-user-card-message-timeline">
		<template v-if="Object.keys(props.timeline).length">
			<section
				v-for="[date, messages] of Object.entries(props.timeline).reverse()"
				:key="date"
				:timeline-id="date"
			>
				<div selector="date-boundary" />
				<label>{{ date }}</label>
				<div selector="date-boundary" />

				<div class="seventv-user-card-message-timeline-list">
					<template v-for="msg of messages" :key="msg.sym">
						<component
							:is="msg.instance"
							v-if="msg.instance && msg.instance !== NormalMessage"
							v-bind="msg.componentProps"
							:msg="msg"
						>
							<UserMessage
								:msg="msg"
								:emotes="emotes.active"
								:hide-mod-icons="true"
								:force-timestamp="true"
							/>
						</component>

						<template v-else>
							<UserMessage
								:msg="msg"
								:emotes="emotes.active"
								:hide-mod-icons="true"
								:force-timestamp="true"
							/>
						</template>
					</template>
				</div>
			</section>
		</template>
		<template v-else>
			<div class="seventv-user-card-message-timeline-empty">
				<p>
					{{ t(`user_card.no_${activeTab}`, { user: target.displayName }) }}
				</p>
			</div>
		</template>

		<div v-if="activeTab === 'comments'" class="seventv-user-card-mod-comment-input-container">
			<input
				id="seventv-user-card-mod-comment-input"
				v-model="commentText"
				:placeholder="t('user_card.add_comment_input_placeholder')"
				@keydown.enter="addModComment"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { refAutoReset } from "@vueuse/core";
import { log } from "@/common/Logger";
import type { ChatMessage, ChatUser } from "@/common/chat/ChatMessage";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatEmotes } from "@/composable/chat/useChatEmotes";
import { useApollo } from "@/composable/useApollo";
import { TwTypeModComment } from "@/assets/gql/tw.gql";
import { twitchUserCardCreateModCommentMut } from "@/assets/gql/tw.user-card.gql";
import type { UserCardTabName } from "./UserCardTabs.vue";
import UserMessage from "./UserMessage.vue";
import NormalMessage from "./msg/0.NormalMessage.vue";
import UiScrollable from "@/ui/UiScrollable.vue";

const props = defineProps<{
	activeTab: UserCardTabName;
	target: ChatUser;
	timeline: Record<string, ChatMessage[]>;
	scroller?: InstanceType<typeof UiScrollable>;
}>();

const emit = defineEmits<{
	(e: "add-mod-comment", comment: TwTypeModComment): void;
}>();

const { t } = useI18n();

const ctx = useChannelContext();
const emotes = useChatEmotes(ctx);

const ready = refAutoReset(true, 10);
const apollo = useApollo();
const commentText = ref("");

function scrollToLive(): void {
	if (!props.scroller?.container) return;
	props.scroller.container.scrollTo({
		top: props.scroller.container.scrollHeight,
	});
}

async function addModComment(): Promise<void> {
	if (!commentText.value || !apollo.value) return;

	const text = commentText.value;
	commentText.value = "";

	const resp = await apollo.value
		.mutate<twitchUserCardCreateModCommentMut.Response, twitchUserCardCreateModCommentMut.Variables>({
			mutation: twitchUserCardCreateModCommentMut,
			variables: {
				input: {
					channelID: ctx.id,
					targetID: props.target.id,
					text,
				},
			},
		})
		.catch((err) => log.error("failed to add mod comment", err));
	if (!resp || !resp.data || !resp.data.createModeratorComment) return;

	emit("add-mod-comment", resp.data?.createModeratorComment.comment);
	nextTick(scrollToLive);
}

watch(
	() => props.activeTab,
	() => {
		ready.value = false;

		setTimeout(() => {
			scrollToLive();
		}, 10);
	},
);

watch(props.timeline, () => {
	if (!props.scroller?.container || props.scroller.container.scrollTop !== 0) return;

	scrollToLive();
});
</script>

<style scoped lang="scss">
section {
	display: grid;
	grid-template-columns: 1fr 1fr 1fr;
	grid-template-rows: 1fr;
	grid-template-areas:
		"dateboundleft date dateboundright"
		"msg msg msg";
	padding-bottom: 1rem;

	label {
		grid-area: date;
		display: grid;
		justify-items: center;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--seventv-muted);
		margin: 0.5rem 0;
	}

	div:nth-of-type(1) {
		grid-area: dateboundleft;
		height: 0.1rem;
	}

	div:nth-of-type(2) {
		grid-area: dateboundright;
		height: 0.1rem;
	}

	[selector="date-boundary"] {
		height: 0.01rem;
		align-self: center;
		border-bottom: 0.01rem solid rgba(64, 64, 64, 50%);
		margin: 0 0.5rem;
	}

	&[timeline-id="LIVE"] {
		label,
		div[selector="date-boundary"] {
			color: rgb(255, 30, 30);
			border-color: rgb(255, 30, 30);
		}
	}

	.seventv-user-card-message-timeline-list {
		grid-area: msg;
		display: grid;
		grid-template-columns: 1fr;
		row-gap: 1rem;
		margin: 0 0.5rem;

		&:hover {
			.seventv-user-card-mod-comment-button {
				visibility: visible;
			}
		}
	}
}

.seventv-user-card-message-timeline-empty {
	text-align: center;
	margin: 4rem 0;
}

.seventv-user-card-mod-comment-input-container {
	position: sticky;
	bottom: 0;
	padding: 0.5rem 0;
	display: grid;
	grid-template-columns: 1fr;
	width: 100%;

	input {
		background-color: var(--seventv-background-shade-1);
		border: none;
		color: var(--seventv-text-color-normal);
		outline: 0.1rem solid var(--seventv-input-border);
		border-radius: 0.25rem;
		padding: 0.5rem 1rem;
		margin: 0 1rem;
		transition: outline 140ms ease-in-out;

		&:focus {
			outline: 0.1rem solid var(--seventv-primary);
		}
	}
}
</style>
