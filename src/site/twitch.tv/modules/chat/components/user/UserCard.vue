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
					<div class="usertag">
						<p>{{ data.targetUser.displayName }}</p>
					</div>
					<div class="badges"></div>
				</div>
				<div class="greystates"></div>
				<div class="actions">
					<div class="rightactions"></div>
					<div class="leftactions"></div>
				</div>
			</div>
			<div class="seventv-user-card-data">
				<div class="tabs"></div>
				<UiScrollable ref="scroller">
					<UserCardMessageList :timeline="data.messages" :scroller="scroller" />
				</UiScrollable>
			</div>
		</div>
	</main>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch, watchEffect } from "vue";
import { storeToRefs } from "pinia";
import { useStore } from "@/store/main";
import { log } from "@/common/Logger";
import { convertTwitchMessage } from "@/common/Transform";
import type { ChatMessage, ChatUser } from "@/common/chat/ChatMessage";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatMessages } from "@/composable/chat/useChatMessages";
import { useApollo } from "@/composable/useApollo";
import { twitchUserCardQuery } from "@/assets/gql/tw.user-card.gql";
import { twitchUserCardMessagesQuery } from "@/assets/gql/tw.user-card.gql";
import CloseIcon from "@/assets/svg/icons/CloseIcon.vue";
import UserCardMessageList from "./UserCardMessageList.vue";
import UiScrollable from "@/ui/UiScrollable.vue";

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

const scroller = ref<InstanceType<typeof UiScrollable> | undefined>();
const dragHandle = ref<HTMLDivElement | undefined>();
const cardRef = ref<HTMLElement | null>(null);
const data = reactive({
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
	messages: {} as Record<string, ChatMessage[]>,
});

async function fetchMessageLogs(): Promise<ChatMessage[]> {
	if (!data.targetUser || !apollo) return [];

	const msgResp = await apollo
		.query<twitchUserCardMessagesQuery.Response, twitchUserCardMessagesQuery.Variables>({
			query: twitchUserCardMessagesQuery,
			variables: {
				channelLogin: ctx.username,
				senderID: data.targetUser.id,
			},
		})
		.catch((err) => Promise.reject(err));
	if (!msgResp || msgResp.errors?.length || !Array.isArray(msgResp.data.channel.logs.bySender.edges)) return [];

	return msgResp.data.channel.logs.bySender.edges.map((edge) => convertTwitchMessage(edge.node));
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
		.then((resp) => {
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

	// Display live messages
	const msgList = [] as ChatMessage[];
	msgList.push(...messages.find((msg) => !!msg.author && msg.author.id === props.target.id, true));

	// Query messages if the permission is met
	if (data.targetUser && (data.canActorAccessLogs || (identity.value && data.targetUser.id === identity.value.id))) {
		msgList.unshift(...(await fetchMessageLogs()));
	}

	msgList.sort((a, b) => a.timestamp - b.timestamp);

	// iterate by msg timestamp and group them into data.messagesd
	const liveMessages = messages.find((msg) => !!msg.author && msg.author.id === props.target.id, true);
	const liveIDs = new Set<string>(liveMessages.map((m) => m.id));

	for (const msg of msgList) {
		if (!msg.timestamp) continue;

		const date = new Date(msg.timestamp);
		const key = liveIDs.has(msg.id) ? "LIVE" : `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

		if (!data.messages[key]) data.messages[key] = [];
		data.messages[key].push(msg);
	}
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
	grid-template-rows: 9rem 1fr 1fr;
	grid-auto-flow: row;
	grid-template-areas:
		"identity"
		"greystates"
		"actions";
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
		background-color: black;
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

.usertag {
	grid-area: usertag;
	display: grid;
	align-content: space-around;
	padding: 0.25rem 0;
	z-index: 1;

	p {
		font-size: 1.5rem;
		font-weight: 900;
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
