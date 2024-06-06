<template />

<script setup lang="ts">
import { onUnmounted, watchEffect } from "vue";
import { log } from "@/common/Logger";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatMessages } from "@/composable/chat/useChatMessages";
import { PubSubMessage, PubSubMessageData, usePubSub } from "@/composable/usePubSub";
import { useConfig } from "@/composable/useSettings";

const ctx = useChannelContext();
const messages = useChatMessages(ctx);
const pubsub = usePubSub();
const showMonitoredLowTrustUser = useConfig<boolean>("highlights.basic.monitored_low_trust_user");
const showReturningChatter = useConfig<boolean>("highlights.basic.returning_chatter");
const showRaider = useConfig<boolean>("highlights.basic.raider");

const highlightOrder = {
	returning_chatter: 0,
	raider: 1,
};

// Update the event listener in case the socket is updated
watchEffect(() => {
	if (!pubsub.socket) return;

	pubsub.socket.removeEventListener("message", onPubSubMessage);
	pubsub.socket.addEventListener("message", onPubSubMessage);
});

function onPubSubMessage(ev: MessageEvent) {
	let rootData: PubSubMessage;

	try {
		rootData = JSON.parse(ev.data);
	} catch (e) {
		log.error("Failed to parse pubsub message", (e as Error).message);
		return;
	}
	if (rootData.type !== "MESSAGE") return; // ignore non-message events

	const { topic, message } = rootData.data ?? {};
	if (typeof topic !== "string" || typeof message !== "string") {
		log.warn("received an invalid pubsub message");
		return;
	}

	const { type, data } = JSON.parse(message ?? {}) as PubSubMessageData;

	switch (type) {
		// Message from Monitored Suspicious User
		case "low_trust_user_new_message":
			onLowTrustUserNewMessage(data as PubSubMessageData.LowTrustUserNewMessage);
			break;
		case "low_trust_user_treatment_update":
			onLowTrustUserTreatmentUpdate(data as PubSubMessageData.LowTrustUserTreatmentUpdate);
			break;
		case "moderation_action":
			onModerationAction(data as PubSubMessageData.ModAction);
			break;

		case "chat_rich_embed":
			onChatRichEmbed(data as PubSubMessageData.ChatRichEmbed);
			break;

		case "chat-highlight":
			onChatHighlight(data as PubSubMessageData.ChatHighlight);
			break;

		default:
			break;
	}
}

// Amend a message with data about the user being sus among us0
async function onLowTrustUserNewMessage(msg: PubSubMessageData.LowTrustUserNewMessage) {
	const ctx = msg.low_trust_user;
	if (!ctx) return;

	messages.lowTrustUsers[ctx.id] = {
		id: ctx.low_trust_id,
		types: ctx.types,
		banEvasion: {
			likelihood: ctx.ban_evasion_evaluation,
			evaluatedAt: ctx.evaluated_at,
		},
		sharedBanChannels: ctx.shared_ban_channel_ids,
		treatment: {
			type: ctx.treatment,
			updatedAt: ctx.updated_at,
			updatedBy: ctx.updated_by.login,
		},
		channelSharedBansUpdatedAt: null,
	};

	if (!showMonitoredLowTrustUser.value) return;

	// Find the message
	const matchedMsg = await messages.awaitMessage(msg.message_id).catch((err) => {
		log.debug("failed to find new message for low trust user", err.message);
	});
	if (!matchedMsg) return;

	matchedMsg.setHighlight("#ff7d00", "Monitored Suspicious User");
}

async function onLowTrustUserTreatmentUpdate(msg: PubSubMessageData.LowTrustUserTreatmentUpdate) {
	const lowTrust = messages.lowTrustUsers[msg.target_user_id];

	messages.lowTrustUsers[msg.target_user_id] = {
		id: msg.low_trust_id,
		types: msg.types,
		banEvasion: {
			evaluatedAt: msg.evaluated_at,
			likelihood: msg.ban_evasion_evaluation,
		},
		sharedBanChannels: lowTrust?.sharedBanChannels ?? [],
		treatment: {
			type: msg.treatment === "NO_TREATMENT" ? "NONE" : msg.treatment,
			updatedAt: msg.updated_at,
			updatedBy: msg.updated_by.login,
		},
		channelSharedBansUpdatedAt: null,
	};
}

async function onModerationAction(msg: PubSubMessageData.ModAction) {
	const ctx = msg.moderation_action;
	if (!ctx) return;

	switch (ctx) {
		// Ban/timeout: update message moderation data
		case "ban":
		case "timeout": {
			const msgList = messages.messagesByUser(msg.target_user_login);
			if (!msgList) return;

			const duration = msg.args[1] || null;
			const reason = msg.args[2] ?? "";

			for (const m of msgList) {
				m.moderation.banReason = reason;
				m.moderation.actor = msg.created_by_user_id
					? {
							id: msg.created_by_user_id,
							username: msg.created_by ?? "",
							displayName: msg.created_by ?? "",
							color: "",
						}
					: null;
				m.moderation.banDuration = duration ? parseInt(duration) : null;
				m.moderation.banned = true;
			}
			break;
		}

		default:
			break;
	}
}

async function onChatRichEmbed(msg: PubSubMessageData.ChatRichEmbed) {
	const ctx = msg.twitch_metadata;

	if (!ctx) return;

	// Find the message
	const message = await messages.awaitMessage(msg.message_id).catch((err) => {
		log.debug("failed to find new message for chat rich embed", err.message);
	});
	if (!message) return;

	const { title, author_name, request_url, thumbnail_url, twitch_metadata } = msg;

	message.richEmbed.title = title;
	message.richEmbed.author_name = author_name;
	message.richEmbed.request_url = request_url;
	message.richEmbed.thumbnail_url = thumbnail_url;
	message.richEmbed.twitch_metadata = twitch_metadata;
}

async function onChatHighlight(msg: PubSubMessageData.ChatHighlight) {
	const message = await messages.awaitMessage(msg.msg_id).catch((err) => {
		log.debug("failed to find new message for chat highlight", err.message);
	});
	if (!message) return;

	// If the author of this message has low trust treatment, we don't want to apply a new highlight
	const lowTrust = message.author ? messages.lowTrustUsers[message.author.id] : null;
	if (lowTrust && lowTrust.treatment.type !== "NONE") {
		return;
	}

	const highlights = msg.highlights.sort((a, b) => {
		return highlightOrder[b.type] - highlightOrder[a.type];
	});

	for (const highlight of highlights) {
		switch (highlight.type) {
			case "raider":
				if (showRaider.value)
					message.setHighlight("#6dd126", message.first ? "First Time Chat From Raider" : "Raider");
				break;
			case "returning_chatter":
				if (showReturningChatter.value) message.setHighlight("#3296e6", "Returning Chatter");
				break;
		}
	}
}

onUnmounted(() => {
	if (pubsub.socket) {
		pubsub.socket.removeEventListener("message", onPubSubMessage);
	}
});
</script>
