<template>
	<main class="seventv-user-card-container">
		<div ref="cardRef" class="seventv-user-card">
			<div class="header">
				<div ref="dragHandle" class="identity">
					<div class="menuactions">
						<CloseIcon class="close-button" @click="emit('close')" />
					</div>

					<div class="avatar">
						<img v-if="data.targetUser.avatarURL" :src="data.targetUser.avatarURL" />
					</div>
					<div class="seventv-user-card-usertag">
						<p>{{ data.targetUser.displayName }}</p>

						<!-- LIVE Indicator -->
						<div v-if="data.stream.live" class="seventv-user-card-live-badge">
							<span>LIVE</span>
							<span>{{ data.stream.viewCount }}</span>
						</div>
					</div>

					<div class="badges"></div>
				</div>
				<div class="greystates"></div>
				<div class="actions">
					<div class="rightactions"></div>
					<div class="leftactions"></div>
				</div>
				<!-- Mod Icons -->
				<UserCardMod v-if="data.isActorModerator" />
			</div>
			<div class="seventv-user-card-data">
				<div class="tabs">
					<UserCardTabs
						:active-tab="data.activeTab"
						:message-count="data.count.messages"
						:ban-count="data.count.bans"
						:timeout-count="data.count.timeouts"
						:comment-count="data.count.comments"
						@switch="data.activeTab = $event"
					/>
				</div>
				<UiScrollable ref="scroller" @container-scroll="onScroll">
					<UserCardMessageList
						:active-tab="data.activeTab"
						:timeline="getActiveTimeline()"
						:scroller="scroller"
					/>
				</UiScrollable>
			</div>
		</div>
	</main>
</template>

<script setup lang="ts">
import { nextTick, onMounted, reactive, ref, watch, watchEffect } from "vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { useStore } from "@/store/main";
import { log } from "@/common/Logger";
import { convertTwitchMessage } from "@/common/Transform";
import { ChatMessage, ChatUser } from "@/common/chat/ChatMessage";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatMessages } from "@/composable/chat/useChatMessages";
import { useApollo } from "@/composable/useApollo";
import {
	twitchUserCardMessagesQuery,
	twitchUserCardModLogsQuery,
	twitchUserCardQuery,
} from "@/assets/gql/tw.user-card.gql";
import CloseIcon from "@/assets/svg/icons/CloseIcon.vue";
import UserCardMessageList from "./UserCardMessageList.vue";
import UserCardMod from "./UserCardMod.vue";
import UserCardTabs, { UserCardTabName } from "./UserCardTabs.vue";
import UiScrollable from "@/ui/UiScrollable.vue";
import BasicSystemMessage from "../types/BasicSystemMessage.vue";

const props = defineProps<{
	target: ChatUser;
}>();

const emit = defineEmits<{
	(e: "close"): void;
	(e: "mount-handle", handle: HTMLDivElement): void;
}>();

const ctx = useChannelContext();
const messages = useChatMessages(ctx);
const { identity } = storeToRefs(useStore());

const apollo = useApollo();
const { t } = useI18n();

const scroller = ref<InstanceType<typeof UiScrollable> | undefined>();
const dragHandle = ref<HTMLDivElement | undefined>();
const cardRef = ref<HTMLElement | null>(null);
const data = reactive({
	activeTab: "messages" as UserCardTabName,
	canActorAccessLogs: false,
	isActorModerator: false,
	targetUser: {
		id: props.target.id,
		username: props.target.username,
		displayName: props.target.displayName,
		bannerURL: "",
		avatarURL: "",
		relationship: {
			followedAt: "",
		},
	},
	stream: {
		live: false,
		game: "",
		viewCount: 0,
	},
	messageCursors: new WeakMap<ChatMessage, string>(),
	timelines: {
		messages: {} as Record<string, ChatMessage[]>,
		bans: {} as Record<string, ChatMessage[]>,
		timeouts: {} as Record<string, ChatMessage[]>,
		comments: {} as Record<string, ChatMessage[]>,
	},
	count: {
		messages: 0,
		bans: 0,
		timeouts: 0,
		comments: 0,
	},
});

function getActiveTimeline(): Record<string, ChatMessage[]> {
	return data.timelines[data.activeTab];
}

async function fetchMessageLogs(after?: ChatMessage): Promise<ChatMessage[]> {
	if (!data.targetUser || !apollo || data.activeTab !== "messages") return [];

	const cursor = after ? data.messageCursors.get(after) : undefined;
	const msgResp = await apollo
		.query<twitchUserCardMessagesQuery.Response, twitchUserCardMessagesQuery.Variables>({
			query: twitchUserCardMessagesQuery,
			variables: {
				channelLogin: ctx.username,
				senderID: data.targetUser.id,
				cursor,
			},
		})
		.catch((err) => Promise.reject(err));
	if (!msgResp || msgResp.errors?.length || !Array.isArray(msgResp.data.channel.logs.bySender.edges)) return [];

	const result = [] as ChatMessage[];

	for (const edge of msgResp.data.channel.logs.bySender.edges) {
		if (!edge.node) continue;

		const msg = convertTwitchMessage(edge.node);

		result.push(msg);
		data.messageCursors.set(msg, edge.cursor);
	}

	return result;
}

async function fetchModeratorData(): Promise<void> {
	if (!data.targetUser || !apollo) return;

	const resp = await apollo
		.query<twitchUserCardModLogsQuery.Response, twitchUserCardModLogsQuery.Variables>({
			query: twitchUserCardModLogsQuery,
			variables: {
				channelLogin: ctx.username,
				channelID: ctx.id,
				targetID: data.targetUser.id,
			},
		})
		.catch((err) => Promise.reject(err));
	if (!resp || resp.errors?.length || !resp.data.channelUser) return;

	data.count.messages = resp.data.channelUser.modLogs.messages.messageCount;
	data.count.bans = resp.data.channelUser.modLogs.bans.actionCount;
	data.count.timeouts = resp.data.channelUser.modLogs.timeouts.actionCount;
	data.count.comments = resp.data.viewerCardModLogs.comments.edges.length ?? 0;

	const timeouts = resp.data.channelUser.modLogs.timeouts.edges;
	const bans = resp.data.channelUser.modLogs.bans.edges;

	for (const [tabName, a] of [
		["timeouts", timeouts] as [UserCardTabName, typeof timeouts],
		["bans", bans] as [UserCardTabName, typeof bans],
	]) {
		const result = [] as ChatMessage[];

		for (const e of a) {
			const key = {
				TIMEOUT_USER: e.node.details.reason
					? "chat.system.mod_timeout_user_reason"
					: "chat.system.mod_timeout_user",
				UNTIMEOUT_USER: "chat.system.mod_undo_timeout_user",
				BAN_USER: e.node.details.reason ? "chat.system.mod_ban_user_reason" : "chat.system.mod_ban_user",
				UNBAN_USER: "chat.system.mod_undo_ban_user",
			}[e.node.action];

			const m = new ChatMessage(e.node.id).setComponent(BasicSystemMessage, {
				text: t(key, {
					actor: e.node.user?.login,
					victim: e.node.target?.login,
					duration: e.node.details?.durationSeconds,
					reason: e.node.details?.reason,
				}),
			});
			m.setTimestamp(Date.parse(e.node.timestamp));

			result.push(m);
		}

		addMessages(result, tabName);
	}
}

function onScroll(): void {
	if (!scroller.value || !scroller.value.container) return;

	const container = scroller.value.container;
	if (container.scrollTop > 0) return;

	const key = getTimelineKey(
		new Date(Math.min(...Object.keys(data.timelines.messages).map((key) => Date.parse(key) || Infinity))),
	);
	if (!key) return;

	const timeline = data.timelines.messages[key];
	if (!timeline) return;

	const firstMsg = timeline[0];
	if (!firstMsg) return;

	scrollTo(1);
	fetchMessageLogs(firstMsg)
		.then((msgs) => {
			if (!msgs.length) return;

			addMessages(msgs);
		})
		.catch((err) => {
			log.error("Failed to fetch more messages", err);
		});
}

function getTimelineKey(date: Date): string {
	return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

/**
 * Add messages to the timeline
 */
function addMessages(msgs: ChatMessage[], timelineName: UserCardTabName = "messages"): void {
	const tl = data.timelines[timelineName];

	const liveMessages = messages.find((msg) => !!msg.author && msg.author.id === props.target.id, true);
	const liveIDs = new Set<string>(liveMessages.map((m) => m.id));

	for (const msg of msgs) {
		if (!msg.timestamp) continue;

		const key = liveIDs.has(msg.id) ? "LIVE" : getTimelineKey(new Date(msg.timestamp));

		if (!tl[key]) tl[key] = [];
		else if (tl[key].find((m) => m.id === msg.id)) continue;

		tl[key].unshift(msg);
		tl[key].sort((a, b) => a.timestamp - b.timestamp);
	}
}

function scrollTo(h: number): void {
	if (!scroller.value || !scroller.value.container) return;

	scroller.value.container.scrollTo({ top: h });
}

watchEffect(async () => {
	if (!apollo) return;

	apollo
		.query<twitchUserCardQuery.Response, twitchUserCardQuery.Variables>({
			query: twitchUserCardQuery,
			variables: {
				channelID: ctx.id,
				channelLogin: ctx.username,
				hasChannelID: true,
				targetLogin: props.target.username,
				withStandardGifting: false,
				isViewerBadgeCollectionEnabled: false,
			},
		})
		.then(async (resp) => {
			// Capture privilege state
			if (resp.data.channelUser && resp.data.channelUser.self) {
				data.isActorModerator = resp.data.channelUser.self.isModerator;
			}

			// Capture log access
			if (resp.data.channel) {
				data.canActorAccessLogs = resp.data.channel.moderationSettings?.canAccessViewerCardModLogs ?? false;
			}

			if (resp.data.targetUser) {
				data.targetUser.id = resp.data.targetUser.id;
				data.targetUser.username = resp.data.targetUser.login;
				data.targetUser.displayName = resp.data.targetUser.displayName;
				data.targetUser.avatarURL = resp.data.targetUser.profileImageURL;
				data.targetUser.bannerURL = resp.data.targetUser.bannerImageURL ?? "";
				data.targetUser.relationship.followedAt = resp.data.targetUser.relationship?.followedAt ?? "";

				if (resp.data.targetUser.stream) {
					data.stream.live = true;
					data.stream.game = resp.data.targetUser.stream.game?.displayName ?? "";
					data.stream.viewCount = resp.data.targetUser.stream.viewersCount;
				}
			}

			// Query messages if the permission is met
			if (
				data.targetUser &&
				(data.canActorAccessLogs || (identity.value && data.targetUser.id === identity.value.id))
			) {
				addMessages(await fetchMessageLogs());
				fetchModeratorData();
			}
		})
		.catch((err) => log.error("failed to query user card", err));
});

watch(
	() => data.targetUser.bannerURL,
	(url) => {
		if (!url || !cardRef.value) return;

		cardRef.value.style.setProperty("--seventv-user-card-banner-url", `url(${url})`);
	},
);

onMounted(async () => {
	if (dragHandle.value) {
		emit("mount-handle", dragHandle.value);
	}

	addMessages(messages.find((msg) => !!msg.author && msg.author.id === props.target.id, true));

	// Scroll to bottom
	nextTick(() => {
		if (!scroller.value || !scroller.value.container) return;

		scrollTo(scroller.value.container.scrollHeight);
	});
});
</script>

<style scoped lang="scss">
main.seventv-user-card-container {
	display: block;
	width: 100%;
	height: 100%;
}

.seventv-user-card {
	display: grid;
	grid-template-columns: 1fr;
	grid-template-rows: 45% 55%;
	grid-auto-flow: column;
	grid-template-areas:
		"header"
		"data";

	height: 42rem;
	width: 32rem;

	box-shadow: 0 0 0.5rem 0.5rem hsla(0deg, 0, 0, 20%);
	background-color: var(--seventv-background-transparent-1);
	backdrop-filter: blur(2rem);
	border-radius: 0.5rem;
}

.header {
	display: grid;
	grid-template-columns: 1fr;
	grid-template-rows: 9rem 1fr 1fr 1fr;
	grid-auto-flow: row;
	grid-template-areas:
		"identity"
		"greystates"
		"actions"
		"modactions";
	grid-area: header;
}

.identity {
	cursor: move;
	display: grid;
	grid-template-columns: 9rem 1fr;
	grid-template-rows: 1fr 1fr;
	grid-auto-flow: row;
	grid-template-areas:
		"avatar usertag"
		"avatar badges";
	grid-area: identity;

	background: var(--seventv-user-card-banner-url);
	background-repeat: no-repeat;
	background-position: center top;
	background-size: cover;

	&::before {
		content: " ";
		position: fixed;
		width: 100%;
		height: 9rem;
		opacity: 0.68;
		background-color: var(--seventv-background-transparent-1);
	}
}

.menuactions {
	cursor: pointer;
	z-index: 10;
	position: absolute;
	right: 0.5rem;
	top: 0.5rem;
	height: 2rem;
	width: 2rem;

	.close-button {
		padding: 0.25rem;
		width: 100%;
		height: 100%;
		border-radius: 0.25rem;

		&:hover {
			background-color: var(--seventv-highlight-neutral-1);
		}
	}
}

.avatar {
	display: grid;
	align-content: center;
	justify-content: center;
	grid-area: avatar;

	img {
		clip-path: circle(50% at 50% 50%);
	}
}

.seventv-user-card-usertag {
	grid-area: usertag;
	display: inline-block;
	align-content: space-around;
	padding: 0.25rem 0;
	z-index: 1;

	p {
		font-size: 1.5rem;
		font-weight: 900;
	}

	.seventv-user-card-live-badge {
		grid-area: live;
		z-index: 1;

		display: inline-block;
		padding: 0 0.25rem;
		font-size: 1rem;
		font-weight: 900;

		span {
			padding: 0 0.25rem;
		}

		:nth-child(1) {
			border-top-left-radius: 0.25rem;
			border-bottom-left-radius: 0.25rem;
			background-color: rgb(255, 60, 60);
		}

		:nth-child(2) {
			background-color: var(--seventv-text-color-normal);
			color: var(--seventv-background-shade-1);
			border-top-right-radius: 0.25rem;
			border-bottom-right-radius: 0.25rem;
		}
	}
}

.badges {
	grid-area: badges;
}

.greystates {
	display: grid;
	grid-auto-rows: 1fr;
	gap: 0.5em 0;
	grid-auto-flow: row;
	z-index: 1;
	grid-area: greystates;
}

.actions {
	display: grid;
	grid-template-columns: 1fr 1fr;
	grid-template-rows: 1fr;
	gap: 0 1rem;
	grid-auto-flow: row;
	grid-template-areas: "leftactions rightactions";
	grid-area: actions;
}

.rightactions {
	grid-area: rightactions;
}

.leftactions {
	display: grid;
	grid-template-columns: 1fr 1fr 1fr;
	grid-template-rows: 1fr;
	grid-auto-flow: row;
	grid-template-areas: ". . .";
	grid-area: leftactions;
}

.seventv-user-card-data {
	display: grid;
	grid-template-columns: 1fr;
	grid-template-rows: 0.5fr 2.5fr;
	grid-auto-flow: row;
	grid-template-areas:
		"tabs"
		"messagelist";
	grid-area: data;
	background-color: var(--seventv-background-transparent-2);
}

.tabs {
	grid-area: tabs;
}
</style>
