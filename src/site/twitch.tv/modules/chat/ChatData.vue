<template />
<script setup lang="ts">
import { onUnmounted, toRef } from "vue";
import { ChatMessage } from "@/common/chat/ChatMessage";
import { db } from "@/db/idb";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatEmotes } from "@/composable/chat/useChatEmotes";
import { useChatMessages } from "@/composable/chat/useChatMessages";
import { useLiveQuery } from "@/composable/useLiveQuery";
import { WorkletEvent, useWorker } from "@/composable/useWorker";
import EmoteSetUpdateMessage from "./components/types/EmoteSetUpdateMessage.vue";
import { v4 as uuidv4 } from "uuid";

const { target } = useWorker();
const ctx = useChannelContext();
const channelID = toRef(ctx, "id");
const messages = useChatMessages(ctx);
const emotes = useChatEmotes(ctx);

// query the channel's emote set bindings
const channelSets = useLiveQuery(
	() =>
		db.channels
			.where("id")
			.equals(ctx.id ?? "")
			.first()
			.then((c) => c?.set_ids ?? []),
	() => {
		// reset the third-party emote providers
		emotes.providers["7TV"] = {};
		emotes.providers["FFZ"] = {};
		emotes.providers["BTTV"] = {};
	},
	{
		reactives: [channelID],
	},
);

// query the channel's active emote sets
useLiveQuery(
	() =>
		db.emoteSets
			.where("id")
			.anyOf(channelSets.value ?? [])
			.or("scope")
			.equals("GLOBAL")
			.sortBy("priority"),
	(sets) => {
		if (!sets) return;

		for (const set of sets) {
			const provider = (set.provider ?? "UNKNOWN") as SevenTV.Provider;

			if (!emotes.providers[provider]) emotes.providers[provider] = {};
			emotes.providers[provider][set.id] = set;

			emotes.sets[set.id] = set;
		}

		const o = {} as Record<SevenTV.ObjectID, SevenTV.ActiveEmote>;
		for (const emote of sets.flatMap((set) => set.emotes)) {
			if (!emote) return;
			o[emote.name] = emote;
		}

		for (const e in emotes.emojis) {
			const emoji = emotes.emojis[e];
			if (!emoji || !emoji.unicode) continue;

			o[emoji.unicode] = emoji;
		}

		for (const e in o) {
			emotes.active[e] = o[e];
		}
	},
	{
		reactives: [channelSets],
	},
);

function onEmoteSetUpdated(ev: WorkletEvent<"emote_set_updated">) {
	const { id, emotes_added, emotes_removed, user } = ev.detail;
	if (!channelSets.value?.includes(id)) return; // not a channel emote set

	const set = emotes.sets[id];

	// Handle added emotes
	for (const emote of emotes_added) {
		emotes.active[emote.name] = emote;
		if (emotes.sets[id]) {
			set.emotes.push(emote);
		}
	}

	// Handle removed emotes
	for (let i = 0; i < emotes_removed.length; i++) {
		const emote = emotes_removed[i];
		const e = emotes.active[emote.name];
		if (!e || e.id !== emote.id) continue;

		emotes_removed[i].data = e.data;
		delete emotes.active[emote.name];
		if (emotes.sets[id]) {
			const i = set.emotes.findIndex((e) => e.id === emote.id);
			if (i !== -1) set.emotes.splice(i, 1);
		}
	}

	const msg = new ChatMessage(uuidv4());
	msg.setComponent(EmoteSetUpdateMessage, {
		appUser: user,
		add: emotes_added,
		remove: emotes_removed,
	});
	messages.add(msg);
}

function onTwitchEmoteSetData(ev: WorkletEvent<"twitch_emote_set_data">) {
	if (!emotes.providers.TWITCH) {
		emotes.providers.TWITCH = {};
	}

	emotes.providers.TWITCH[ev.detail.id] = ev.detail;
}

target.addEventListener("emote_set_updated", onEmoteSetUpdated);
// Receive twitch emote sets from the worker
target.addEventListener("twitch_emote_set_data", onTwitchEmoteSetData);

onUnmounted(() => {
	target.removeEventListener("emote_set_updated", onEmoteSetUpdated);
	target.removeEventListener("twitch_emote_set_data", onTwitchEmoteSetData);
});
</script>
