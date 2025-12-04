<template>
	<div
		v-if="user && user.displayName"
		ref="tagRef"
		class="seventv-chat-user"
		:style="shouldColor ? { color: user.color } : {}"
	>
		<!--Badge List -->
		<span
			v-if="
				!hideBadges &&
				((twitchBadges.length && twitchBadgeSets?.count) || cosmetics.badges.size || sourceData || elowardBadge)
			"
			class="seventv-chat-user-badge-list"
		>
			<Badge
				v-if="sourceData"
				:key="sourceData.login"
				:badge="sourceData"
				:alt="sourceData.displayName"
				type="picture"
			/>
			<Badge
				v-for="badge of twitchBadges"
				:key="badge.id"
				:badge="badge"
				:alt="badge.title"
				type="twitch"
				@click="handleClick($event)"
			/>
			<template v-if="shouldRender7tvBadges">
				<Badge
					v-for="badge of activeBadges"
					:key="badge.id"
					:badge="badge"
					:alt="badge.data.tooltip"
					type="app"
				/>
			</template>

			<!-- EloWard Rank Badge - Rightmost position (closest to username) -->
			<EloWardBadge v-if="elowardBadge" :badge="elowardBadge" :username="user.username" />
		</span>

		<!-- Message Author -->
		<span
			v-tooltip="shouldPaint ? `Paint: ${paint!.data.name}` : ''"
			class="seventv-chat-user-username"
			@click="handleClick($event)"
		>
			<span v-cosmetic-paint="shouldPaint ? paint!.id : null">
				<span v-if="isMention && !hideAt">@</span>
				<span>{{ user.displayName }}</span>
				<span v-if="user.intl"> ({{ user.username }})</span>
			</span>
		</span>
	</div>

	<template v-if="showUserCard && tagRef">
		<Teleport to="#seventv-float-context">
			<UiDraggable
				class="seventv-user-card-float"
				:handle="cardHandle"
				:initial-anchor="tagRef"
				:initial-middleware="[shift({ mainAxis: true, crossAxis: true }), autoPlacement()]"
				:once="true"
			>
				<UserCard :target="props.user" @close="showUserCard = false" @mount-handle="cardHandle = $event" />
			</UiDraggable>
		</Teleport>
	</template>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, toRef, watch, watchEffect } from "vue";
import type { ChatUser } from "@/common/chat/ChatMessage";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatProperties } from "@/composable/chat/useChatProperties";
import { useCosmetics } from "@/composable/useCosmetics";
import { useConfig } from "@/composable/useSettings";
import EloWardBadge from "@/site/twitch.tv/modules/eloward/components/EloWardBadge.vue";
import { useEloWardRanks } from "@/site/twitch.tv/modules/eloward/composables/useEloWardRanks";
import type { EloWardBadge as EloWardBadgeType } from "@/site/twitch.tv/modules/eloward/composables/useEloWardRanks";
import { useGameDetection } from "@/site/twitch.tv/modules/eloward/composables/useGameDetection";
import Badge from "./Badge.vue";
import UserCard from "./UserCard.vue";
import UiDraggable from "@/ui/UiDraggable.vue";
import { autoPlacement, shift } from "@floating-ui/dom";

const props = withDefaults(
	defineProps<{
		user: ChatUser;
		sourceData?: Twitch.SharedChat;
		msgId?: symbol;
		isMention?: boolean;
		hideAt?: boolean;
		hideBadges?: boolean;
		clickable?: boolean;
		badges?: Record<string, string>;
	}>(),
	{
		clickable: true,
	},
);

const emit = defineEmits<{
	(e: "open-native-card", ev: MouseEvent): void;
}>();

enum MentionStyle {
	NONE = 0,
	COLORED = 1,
	PAINTED = 2,
}

const ctx = useChannelContext();
const properties = useChatProperties(ctx);
const cosmetics = useCosmetics(props.user.id);
const shouldRenderPaint = useConfig<boolean>("vanity.nametag_paints");
const shouldRender7tvBadges = useConfig<boolean>("vanity.7tv_Badges");
const betterUserCardEnabled = useConfig<boolean>("chat.user_card");
const twitchBadges = ref<Twitch.ChatBadge[]>([]);
const twitchBadgeSets = toRef(properties, "twitchBadgeSets");
const mentionStyle = useConfig<MentionStyle>("chat.colored_mentions");

// EloWard integration
const elowardRanks = useEloWardRanks();
const gameDetection = useGameDetection();
const elowardEnabled = useConfig<boolean>("eloward.enabled");

const tagRef = ref<HTMLDivElement>();
const showUserCard = ref(false);
const cardHandle = ref<HTMLDivElement>();
const paint = ref<SevenTV.Cosmetic<"PAINT"> | null>(null);
const activeBadges = ref<SevenTV.Cosmetic<"BADGE">[]>([]);

const shouldPaint = computed(() => {
	if (!shouldRenderPaint.value) return false;
	if (!paint.value) return false;
	if (!props.isMention) return true;
	return mentionStyle.value === MentionStyle.PAINTED;
});

const shouldColor = computed(() => {
	return !props.isMention || mentionStyle.value === MentionStyle.COLORED;
});

function handleClick(ev: MouseEvent) {
	if (!props.clickable) return;
	if (!betterUserCardEnabled.value) {
		emit("open-native-card", ev);
		return;
	}

	showUserCard.value = !showUserCard.value;
}

watchEffect(() => {
	if (props.badges && twitchBadgeSets.value && !twitchBadges.value.length) {
		for (const [key, value] of Object.entries(props.badges)) {
			const setID = key;
			const badgeID = value;

			for (const setGroup of [
				props.sourceData?.badges.channelsBySet ?? twitchBadgeSets.value.channelsBySet,
				twitchBadgeSets.value.globalsBySet,
			]) {
				if (!setGroup) continue;

				const set = setGroup.get(setID);
				if (!set) continue;

				const badge = set.get(badgeID);
				if (!badge) continue;

				twitchBadges.value.push(badge);
				break;
			}
		}
	}
});

const t = Date.now();
const stop = watch(
	[() => cosmetics.paints, () => cosmetics.badges],
	([paints, badges]) => {
		// condition to ignore
		// msg is not the last message, or is older than a second
		if (props.msgId && props.user.lastMsgId && props.msgId !== props.user.lastMsgId && Date.now() - t > 5000) {
			nextTick(() => stop());
			return;
		}

		paint.value = paints && paints.size ? paints.values().next().value : null;
		activeBadges.value = badges && badges.size ? [...badges.values()] : [];
	},
	{ immediate: true },
);

// EloWard badge integration
const elowardBadge = ref<EloWardBadgeType | null>(null);

const initializeEloWardBadge = () => {
	if (!elowardEnabled.value || !gameDetection.isLeagueStream.value) {
		elowardBadge.value = null;
		return;
	}

	const username = props.user.username;
	if (!username) {
		elowardBadge.value = null;
		return;
	}

	const cachedData = elowardRanks.getCachedRankData(username);

	if (cachedData !== undefined) {
		elowardBadge.value = cachedData ? elowardRanks.getRankBadge(cachedData) : null;
		return;
	}

	elowardRanks
		.fetchRankData(username)
		.then((rankData) => {
			elowardBadge.value = rankData ? elowardRanks.getRankBadge(rankData) : null;
		})
		.catch(() => {
			elowardBadge.value = null;
		});
};

initializeEloWardBadge();

watch(() => props.user.username, initializeEloWardBadge);
watch(elowardEnabled, initializeEloWardBadge);
watch(() => gameDetection.isLeagueStream.value, initializeEloWardBadge);
</script>

<style scoped lang="scss">
.seventv-chat-user {
	display: inline-block;
	cursor: pointer;
	word-break: break-all;
	vertical-align: baseline;
	margin: -0.2rem;
	padding: 0.2rem;

	.seventv-chat-user-badge-list {
		display: inline-flex !important;
		align-items: center !important;
		vertical-align: baseline !important;
		gap: 0px !important;
		margin-right: 0px !important;

		:deep(img) {
			vertical-align: middle;
		}

		.seventv-chat-badge ~ .seventv-chat-badge {
			margin-left: 0.25em;
		}
	}

	// Username spacing after badge list
	.seventv-chat-user-badge-list + .seventv-chat-user-username {
		margin-left: 2px !important;
	}

	.seventv-chat-user-username {
		font-weight: 700;
	}
}

.seventv-user-card-float {
	position: fixed;
}
</style>
