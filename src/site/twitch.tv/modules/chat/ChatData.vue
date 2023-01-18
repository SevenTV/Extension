<template />
<script setup lang="ts">
import { onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import { useStore } from "@/store/main";
import { useChatEmotes } from "@/composable/chat/useChatEmotes";
import { useChatMessages } from "@/composable/chat/useChatMessages";
import { useLiveQuery } from "@/composable/useLiveQuery";
import { WorkletEvent, useWorker } from "@/composable/useWorker";
import { db } from "@/db/idb";
import { MessageType } from "../..";
import { v4 as uuidv4 } from "uuid";

const { target } = useWorker();
const { channel } = storeToRefs(useStore());
const { emoteProviders, emoteMap } = useChatEmotes();
const { addMessage } = useChatMessages();

// query the channel's emote set bindings
const channelSets = useLiveQuery(
	() =>
		db.channels
			.where("id")
			.equals(channel.value?.id ?? "")
			.first()
			.then((c) => c?.set_ids ?? []),
	() => {
		// reset the third-party emote providers
		emoteProviders.value["7TV"] = {};
		emoteProviders.value["FFZ"] = {};
		emoteProviders.value["BTTV"] = {};
	},
	{
		reactives: [channel],
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
			if (!emoteProviders.value[provider]) emoteProviders.value[provider] = {};
			emoteProviders.value[provider][set.id] = set;
		}

		const o = {} as Record<SevenTV.ObjectID, SevenTV.ActiveEmote>;
		for (const emote of sets.flatMap((set) => set.emotes)) {
			if (!emote) return;
			o[emote.name] = emote;
		}

		emoteMap.value = o;
	},
	{
		reactives: [channelSets],
	},
);

function onEmoteSetUpdated(ev: WorkletEvent<"emote_set_updated">) {
	const { id, emotes_added, emotes_removed, user } = ev.detail;
	if (!channelSets.value?.includes(id)) return; // not a channel emote set

	// Handle added emotes
	for (const emote of emotes_added) {
		emoteMap.value[emote.name] = emote;
	}

	// Handle removed emotes
	for (let i = 0; i < emotes_removed.length; i++) {
		const emote = emotes_removed[i];
		const e = emoteMap.value[emote.name];
		if (e.id !== emote.id) continue;

		emotes_removed[i].data = e.data;
		delete emoteMap.value[emote.name];
	}

	addMessage<Twitch.SeventvEmoteSetUpdateMessage>({
		id: uuidv4(),
		type: MessageType.SEVENTV_EMOTE_SET_UPDATE,
		user: null,
		app_user: user,
		add: emotes_added,
		remove: emotes_removed,
	});
}

function onTwitchEmoteSetData(ev: WorkletEvent<"twitch_emote_set_data">) {
	if (!emoteProviders.value.TWITCH) {
		emoteProviders.value.TWITCH = {};
	}

	emoteProviders.value.TWITCH[ev.detail.id] = ev.detail;
}

target.addEventListener("emote_set_updated", onEmoteSetUpdated);
// Receive twitch emote sets from the worker
target.addEventListener("twitch_emote_set_data", onTwitchEmoteSetData);

onUnmounted(() => {
	target.removeEventListener("emote_set_updated", onEmoteSetUpdated);
	target.removeEventListener("twitch_emote_set_data", onTwitchEmoteSetData);
});
</script>
