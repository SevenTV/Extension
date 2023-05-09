<template>
	<main class="seventv-user-card-container">
		<div ref="cardRef" class="seventv-user-card">
			<div class="seventv-user-card-header">
				<!--Identity (avatar, nametag, badges) -->
				<div ref="dragHandle" class="seventv-user-card-identity">
					<div class="seventv-user-card-menuactions">
						<LogoTwitch v-tooltip="t('user_card.native')" @click="openNativeCard" />
						<CloseIcon class="close-button" @click="emit('close')" />
					</div>

					<div class="seventv-user-card-avatar">
						<img v-if="data.targetUser.avatarURL" :src="data.targetUser.avatarURL" />
					</div>
					<div class="seventv-user-card-usertag">
						<UserTag :user="data.targetUser" :hide-badges="true" :clickable="false" />
					</div>

					<div class="seventv-user-card-badges">
						<Badge
							v-for="badge of data.targetUser.badges"
							:key="badge.id"
							:badge="badge"
							:alt="badge.data.tooltip"
							type="app"
						/>
					</div>
				</div>

				<div class="seventv-user-card-interactive">
					<div class="seventv-user-card-greystates">
						<p v-if="data.targetUser.relationship.followedAt">
							{{ t("user_card.following_since_date", { date: data.targetUser.relationship.followedAt }) }}
						</p>
					</div>

					<UserCardActions />
					<!-- Mod Icons -->
					<UserCardMod
						v-if="data.isActorModerator"
						:target="data.targetUser"
						:ban="data.ban"
						:is-broadcaster="data.isActorBroadcaster"
						:is-moderator="data.isActorModerator"
						@victim-banned="data.ban = $event"
						@victim-unbanned="data.ban = null"
					/>
				</div>
			</div>
			<div class="seventv-user-card-data" :show-tabs="data.isActorModerator">
				<UserCardTabs
					v-if="data.isActorModerator"
					:active-tab="data.activeTab"
					:message-count="data.count.messages"
					:ban-count="data.count.bans"
					:timeout-count="data.count.timeouts"
					:comment-count="data.count.comments"
					@switch="data.activeTab = $event"
				/>
				<UiScrollable ref="scroller" @container-scroll="onScroll">
					<UserCardMessageList
						:active-tab="data.activeTab"
						:target="data.targetUser"
						:timeline="getActiveTimeline()"
						:scroller="scroller"
						@add-mod-comment="addModComment"
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
import { convertTwitchBadge } from "@/common/Transform";
import { ChatMessage, ChatUser } from "@/common/chat/ChatMessage";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatMessages } from "@/composable/chat/useChatMessages";
import { useChatTools } from "@/composable/chat/useChatTools";
import { useApollo } from "@/composable/useApollo";
import { useCosmetics } from "@/composable/useCosmetics";
import { TwTypeChatBanStatus, TwTypeModComment } from "@/assets/gql/tw.gql";
import {
	twitchUserCardMessagesQuery,
	twitchUserCardModLogsQuery,
	twitchUserCardQuery,
} from "@/assets/gql/tw.user-card.gql";
import CloseIcon from "@/assets/svg/icons/CloseIcon.vue";
import LogoTwitch from "@/assets/svg/logos/LogoTwitch.vue";
import Badge from "./Badge.vue";
import UserCardActions from "./UserCardActions.vue";
import UserCardMessageList from "./UserCardMessageList.vue";
import UserCardMod from "./UserCardMod.vue";
import UserCardTabs from "./UserCardTabs.vue";
import type { UserCardTabName } from "./UserCardTabs.vue";
import UserTag from "./UserTag.vue";
import UiScrollable from "@/ui/UiScrollable.vue";
import BasicSystemMessage from "../types/BasicSystemMessage.vue";
import formatDate from "date-fns/fp/format";

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
const cosmetics = useCosmetics(props.target.id);
const tools = useChatTools(ctx);

const apollo = useApollo();
const { t } = useI18n();

const scroller = ref<InstanceType<typeof UiScrollable> | undefined>();
const dragHandle = ref<HTMLDivElement | undefined>();
const cardRef = ref<HTMLElement | null>(null);
const data = reactive({
	activeTab: "messages" as UserCardTabName,
	canActorAccessLogs: false,
	isActorModerator: false,
	isActorBroadcaster: false,
	ban: null as TwTypeChatBanStatus | null,
	targetUser: {
		id: props.target.id,
		username: props.target.username,
		displayName: props.target.displayName,
		bannerURL: "",
		avatarURL: "",
		color: "",
		badges: [] as SevenTV.Cosmetic<"BADGE">[],
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
	} as Record<UserCardTabName, Record<string, ChatMessage[]>>,
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

	data.ban = resp.data.banStatus;

	const timeouts = resp.data.channelUser.modLogs.timeouts.edges;
	const bans = resp.data.channelUser.modLogs.bans.edges;

	// Add timeouts and bans to the timeline
	for (const [tabName, a] of [
		["timeouts", timeouts] as [UserCardTabName, typeof timeouts],
		["bans", bans] as [UserCardTabName, typeof bans],
	]) {
		const result = [] as ChatMessage[];

		for (const e of a) {
			const key = {
				TIMEOUT_USER: e.node.details.reason ? "messages.mod_timeout_user_reason" : "messages.mod_timeout_user",
				UNTIMEOUT_USER: "messages.mod_undo_timeout_user",
				BAN_USER: e.node.details.reason ? "messages.mod_ban_user_reason" : "messages.mod_ban_user",
				UNBAN_USER: "messages.mod_undo_ban_user",
			}[e.node.action];

			const m = new ChatMessage(e.node.id).setComponent(BasicSystemMessage, {
				text: t(key, {
					actor: e.node.user?.login,
					victim: e.node.target?.login,
					duration: e.node.details?.durationSeconds + " seconds",
					reason: e.node.details?.reason,
				}),
			});
			m.setTimestamp(Date.parse(e.node.timestamp));

			result.push(m);
		}

		addMessages(result, tabName);
	}

	// Add comments to the timeline
	for (const e of resp.data.viewerCardModLogs.comments.edges) {
		addModComment(e.node);
	}
}

function addModComment(e: TwTypeModComment): void {
	const m = new ChatMessage(e.id);
	m.setAuthor({
		id: e.author.id,
		username: e.author.login,
		displayName: e.author.displayName,
		color: e.author.chatColor,
	});
	m.setTimestamp(Date.parse(e.timestamp));
	m.body = e.text;

	addMessages([m], "comments");
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

function openNativeCard(ev: MouseEvent): void {
	if (!data.targetUser.username) return;

	const ok = tools.openViewerCard(ev, data.targetUser.username, "");
	if (!ok) return;

	emit("close");
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
				isViewerBadgeCollectionEnabled: true,
			},
		})
		.then(async (resp) => {
			// Capture privilege state
			if (resp.data.channelUser && resp.data.channelUser.self) {
				data.isActorBroadcaster = resp.data.currentUser.id === ctx.id;
				data.isActorModerator = resp.data.channelUser.self.isModerator || data.isActorBroadcaster;
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
				data.targetUser.relationship.followedAt = resp.data.targetUser.relationship?.followedAt
					? formatDate("PPP")(new Date(resp.data.targetUser.relationship.followedAt))
					: "";

				if (resp.data.targetUser.stream) {
					data.stream.live = true;
					data.stream.game = resp.data.targetUser.stream.game?.displayName ?? "";
					data.stream.viewCount = resp.data.targetUser.stream.viewersCount;
				}

				data.targetUser.badges.length = 0;

				if (resp.data.channelViewer && resp.data.channelViewer.earnedBadges?.length) {
					for (let i = 0; i < resp.data.channelViewer.earnedBadges.length; i++) {
						const badge = convertTwitchBadge(resp.data.channelViewer.earnedBadges[i]);
						if (!badge) continue;

						data.targetUser.badges[i] = badge;
					}
				}

				for (const badge of cosmetics.badges.values()) {
					data.targetUser.badges.push(badge);
				}
			}

			// Query messages if the permission is met
			if (
				data.targetUser &&
				(data.canActorAccessLogs || (identity.value && data.targetUser.id === identity.value.id))
			) {
				addMessages(
					(await fetchMessageLogs().catch((err) => log.error("failed to fetch message logs", err))) ?? [],
				);
				fetchModeratorData().catch((err) => log.error("failed to fetch moderator data", err));
			}

			console;
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
$cardWidth: 32rem;
$cardHeight: 42rem;

main.seventv-user-card-container {
	display: block;
}

.seventv-user-card {
	display: grid;
	grid-template-columns: 1fr;
	grid-template-rows: min-content 1fr;
	grid-auto-flow: column;
	grid-template-areas:
		"header"
		"data";

	max-height: $cardHeight;
	width: $cardWidth;

	box-shadow: 0 0 0.5rem 0.5rem hsla(0deg, 0%, 0%, 20%);
	background-color: var(--seventv-background-transparent-1);
	backdrop-filter: blur(2rem);
	border-radius: 0.5rem;
}

.seventv-user-card-header {
	grid-area: header;
	display: grid;
	grid-template-rows: 1fr auto;
	grid-template-areas:
		"identity"
		"states";

	.seventv-user-card-menuactions {
		cursor: pointer;
		z-index: 10;
		position: absolute;
		right: 0.5rem;
		top: 0.5rem;
		height: 2rem;
		display: flex;
		column-gap: 0.25rem;

		svg {
			padding: 0.25rem;
			width: 100%;
			height: 100%;
			border-radius: 0.25rem;

			&:hover {
				background-color: var(--seventv-highlight-neutral-1);
			}
		}
	}

	.seventv-user-card-identity {
		cursor: move;
		display: grid;
		grid-template-columns: max-content 1fr;
		grid-template-rows: auto 1fr;
		grid-auto-flow: row;
		row-gap: 0.25rem;
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
			width: $cardWidth;
			height: 8rem;
			opacity: 0.68;
			background-color: var(--seventv-background-transparent-1);
		}

		.seventv-user-card-avatar {
			display: grid;
			align-content: center;
			justify-content: center;
			padding: 0.5rem;
			grid-area: avatar;

			img {
				clip-path: circle(50% at 50% 50%);
			}
		}

		.seventv-user-card-usertag {
			grid-area: usertag;
			z-index: 1;
			display: block;
			padding-top: 1rem;
			max-width: 21rem;

			p {
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
				font-size: 1.35rem;
				font-weight: 900;
			}
		}

		.seventv-user-card-badges {
			grid-area: badges;
			// grid: position each badge next to the other on the same row, wrapping if necessary
			display: flex;
			flex-wrap: wrap;
			max-width: 18rem;
			gap: 0.5rem;
			align-self: start;
			z-index: 1;

			> * {
				cursor: pointer;
				grid-row: 1;
			}
		}
	}
}

.seventv-user-card-interactive {
	grid-area: states;
	display: grid;
	grid-template-columns: 1fr;
	grid-template-rows: repeat(3, auto);
	grid-template-areas:
		"greystates"
		"actions"
		"mod";
	align-content: space-between;
	background-color: var(--seventv-background-transparent-2);

	.seventv-user-card-greystates {
		grid-area: greystates;
		z-index: 1;
		overflow: clip;
		padding: 0.5rem 1rem;

		p {
			font-size: 1rem;
		}
	}

	.seventv-user-card-actions {
		grid-area: actions;
	}

	.seventv-user-card-mod {
		grid-area: mod;
	}
}

.seventv-user-card-data {
	grid-area: data;
	display: grid;
	grid-template-columns: 1fr;
	grid-template-rows: 0.5fr 2.5fr;
	grid-auto-flow: row;
	max-height: 26rem;
	grid-template-areas:
		"tabs"
		"messagelist";

	&[show-tabs="false"] {
		grid-template-rows: 1fr;
		grid-template-areas: "messagelist";
	}
}

.seventv-user-card-tabs {
	grid-area: tabs;
}
</style>
