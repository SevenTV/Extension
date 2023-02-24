<template />

<script setup lang="ts">
import { toRef } from "vue";
import { db } from "@/db/idb";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatEmotes } from "@/composable/chat/useChatEmotes";
import { useLiveQuery } from "@/composable/useLiveQuery";

const ctx = useChannelContext();
const emotes = useChatEmotes(ctx);

const channelID = toRef(ctx, "id");

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
</script>
