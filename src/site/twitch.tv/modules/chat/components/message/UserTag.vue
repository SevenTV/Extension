<template>
	<div v-if="user && user.displayName" class="seventv-chat-user" :style="{ color: user.color }">
		<!--Badge List -->
		<span v-if="!hideBadges && (twitchBadges.length || cosmetics.badges.size)" class="seventv-chat-user-badge-list">
			<Badge
				v-for="badge of twitchBadges"
				:key="badge.id"
				:badge="badge"
				:alt="badge.title"
				type="twitch"
				@click="(e) => emit('badgeClick', e, badge)"
			/>
			<Badge v-for="badge of activeBadges" :key="badge.id" :badge="badge" :alt="badge.data.tooltip" type="app" />
		</span>

		<!-- Message Author -->
		<span
			v-tooltip="paint && paint.data ? `Paint: ${paint.data.name}` : ''"
			class="seventv-chat-user-username"
			@click="(e) => emit('nameClick', e)"
		>
			<span v-cosmetic-paint="paint ? paint.id : null">
				<span v-if="asMention">@</span>
				<span>{{ user.displayName }}</span>
				<span v-if="user.intl"> ({{ user.username }})</span>
			</span>
		</span>
	</div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import type { ChatUser } from "@/common/chat/ChatMessage";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatProperties } from "@/composable/chat/useChatProperties";
import { useCosmetics } from "@/composable/useCosmetics";
import { useConfig } from "@/composable/useSettings";
import Badge from "./Badge.vue";

const props = defineProps<{
	user: ChatUser;
	msgId?: symbol;
	asMention?: boolean;
	hideBadges?: boolean;
	badges?: Record<string, string>;
}>();

const emit = defineEmits<{
	(event: "nameClick", e: MouseEvent): void;
	(event: "badgeClick", e: MouseEvent, badge: Twitch.ChatBadge): void;
}>();

const ctx = useChannelContext();
const properties = useChatProperties(ctx);
const cosmetics = useCosmetics(props.user.id);
const shouldRenderPaint = useConfig("vanity.nametag_paints");
const twitchBadges = ref([] as Twitch.ChatBadge[]);

const paint = ref<SevenTV.Cosmetic<"PAINT"> | null>(null);
const activeBadges = ref<SevenTV.Cosmetic<"BADGE">[]>([]);

if (props.badges && properties.twitchBadgeSets) {
	for (const [key, value] of Object.entries(props.badges)) {
		const setID = key;
		const badgeID = value;

		for (const setGroup of [properties.twitchBadgeSets.channelsBySet, properties.twitchBadgeSets.globalsBySet]) {
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

const t = Date.now();
const stop = watch(
	[cosmetics.paints, cosmetics.badges],
	([paints, badges]) => {
		// condition to ignore
		// msg is not the last message, or is older than a second
		if (props.msgId && props.user.lastMsgId && props.msgId !== props.user.lastMsgId && Date.now() - t > 5000) {
			nextTick(() => stop());
			return;
		}

		paint.value = shouldRenderPaint.value && paints && paints.size ? paints.values().next().value : null;
		activeBadges.value = [...badges.values()];
	},
	{ immediate: true },
);
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
		margin-right: 0.25em;

		:deep(img) {
			vertical-align: middle;
		}

		.seventv-chat-badge ~ .seventv-chat-badge {
			margin-left: 0.25em;
		}
	}

	.seventv-chat-user-username {
		font-weight: 700;
	}
}
</style>
