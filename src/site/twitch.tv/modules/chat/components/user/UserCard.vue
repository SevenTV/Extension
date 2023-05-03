<template>
	<UiDraggable :handle="dragHandle">
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
				<div class="greystates">greystates</div>
				<div class="actions">
					<div class="rightactions">rightactions</div>
					<div class="leftactions">leftactions</div>
				</div>
			</div>
			<div class="data">
				<div class="tabs">tabs</div>
				<div class="datalisting">datalisting</div>
			</div>
		</div>
	</UiDraggable>
</template>

<script setup lang="ts">
import { reactive, ref, watch, watchEffect } from "vue";
import { storeToRefs } from "pinia";
import { useStore } from "@/store/main";
import type { ChatUser } from "@/common/chat/ChatMessage";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useApollo } from "@/composable/useApollo";
import { TwTypeMessage } from "@/assets/gql/tw.gql";
import { twitchUserCardQuery } from "@/assets/gql/tw.user-card.gql";
import { twitchUserCardMessagesQuery } from "@/assets/gql/tw.user-card.gql";
import CloseIcon from "@/assets/svg/icons/CloseIcon.vue";
import UiDraggable from "@/ui/UiDraggable.vue";

const props = defineProps<{
	target: ChatUser;
}>();

const emit = defineEmits<{
	(e: "close"): void;
}>();

const ctx = useChannelContext();
const { identity } = storeToRefs(useStore());

const apollo = useApollo();

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
	messages: [] as TwTypeMessage[],
});

async function fetchMessageLogs(): Promise<TwTypeMessage[]> {
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

	return msgResp.data.channel.logs.bySender.edges.map((edge) => edge.node);
}

watchEffect(async () => {
	if (!apollo) return;

	const resp = await apollo.query<twitchUserCardQuery.Response, twitchUserCardQuery.Variables>({
		query: twitchUserCardQuery,
		variables: {
			channelID: ctx.id,
			channelLogin: ctx.username,
			hasChannelID: true,
			targetLogin: props.target.username,
			withStandardGifting: false,
			isViewerBadgeCollectionEnabled: false,
		},
	});
	if (!resp) return;

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

	// Query messages if the permission is met
	if (
		!data.messages.length && // Don't query if we already have messages
		data.targetUser &&
		(data.canActorAccessLogs || (identity.value && data.targetUser.id === identity.value.id))
	) {
		data.messages = await fetchMessageLogs();
	}
});

watch(
	() => data.targetUser.bannerURL,
	(url) => {
		if (!url || !cardRef.value) return;

		cardRef.value.style.setProperty("--seventv-user-card-banner-url", `url(${url})`);
	},
);
</script>

<style scoped lang="scss">
.seventv-user-card {
	display: grid;
	grid-template-columns: 1fr;
	grid-template-rows: 45% 55%;
	grid-auto-flow: column;
	grid-template-areas:
		"header"
		"data";

	height: 36rem;
	width: 32rem;

	box-shadow: 0 0 1rem 0 hsla(0deg, 0%, 0%, 20%);
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
	&::before {
		content: " ";
		position: fixed;
		width: 100%;
		height: 9rem;
		opacity: 0.6;
		background-color: black;
	}
}

.menuactions {
	cursor: pointer;
	z-index: 10;
	position: absolute;
	right: 0;
	top: 0;
	height: 2rem;
	width: 2rem;

	.close-button {
		padding: 0.25rem;
		width: 100%;
		height: 100%;
		border-radius: 0.25rem;

		&:hover {
			background-color: var(--seventv-background-transparent-2);
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

.data {
	display: grid;
	grid-template-columns: 1fr;
	grid-template-rows: 0.4fr 1.6fr;
	grid-auto-flow: row;
	grid-template-areas:
		"tabs"
		"datalisting";
	grid-area: data;
}

.tabs {
	grid-area: tabs;
}

.datalisting {
	grid-area: datalisting;
}
</style>
