<template>
	<div />
</template>
<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useStore } from "@/store/main";
import { useChatEmotes } from "@/composable/chat/useChatEmotes";
import { useLiveQuery } from "@/composable/useLiveQuery";
import { useWorker } from "@/composable/useWorker";
import { db } from "@/db/idb";

const { target } = useWorker();
const { channel } = storeToRefs(useStore());
const { emoteProviders, emoteMap } = useChatEmotes();

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
			.or("provider")
			.anyOf("7TV/G", "FFZ/G", "BTTV/G")
			.sortBy("priority"),
	(sets) => {
		if (!sets) return;

		for (const set of sets) {
			const provider = (set.provider?.replace("/G", "") ?? "UNKNOWN") as SevenTV.Provider;
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

// Receive twitch emote sets from the worker
target.addEventListener("twitch_emote_set_data", (ev) => {
	if (!emoteProviders.value.TWITCH) {
		emoteProviders.value.TWITCH = {};
	}

	emoteProviders.value.TWITCH[ev.detail.id] = ev.detail;
});
</script>
