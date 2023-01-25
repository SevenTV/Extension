<template />

<script setup lang="ts">
import { onUnmounted, ref, watchEffect } from "vue";
import { log } from "@/common/Logger";
import { IsChatMessage } from "@/common/type-predicates/Messages";
import { useChatMessages } from "@/composable/chat/useChatMessages";
import { PubSubMessage, PubSubMessageData, usePubSub } from "@/composable/usePubSub";

const messages = useChatMessages();
const pubsub = usePubSub();

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

		default:
			break;
	}
}

// Amend a message with data about the user being sus among us0
async function onLowTrustUserNewMessage(msg: PubSubMessageData.LowTrustUserNewMessage) {
	const ctx = msg.low_trust_user;
	if (!ctx) return;

	// Find the message
	const matchedMsg = await messages.awaitMessage(msg.message_id).catch((err) => {
		log.debug("failed to find new message for low trust user", err.message);
	});
	if (!matchedMsg || !IsChatMessage(matchedMsg)) return;

	const rmsg = ref(matchedMsg);
	rmsg.value.monitored = {
		...ctx,
	};
	rmsg.value.highlight = {
		label: "Monitored Suspicious User",
		color: "#ff7d00",
	};
}

onUnmounted(() => {
	if (pubsub.socket) {
		pubsub.socket.removeEventListener("message", onPubSubMessage);
	}
});
</script>
