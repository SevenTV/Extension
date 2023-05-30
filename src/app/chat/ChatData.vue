<template />
<script setup lang="ts">
import { onUnmounted, ref, toRef } from "vue";
import { useStore } from "@/store/main";
import { ChatMessage } from "@/common/chat/ChatMessage";
import { db } from "@/db/idb";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatEmotes } from "@/composable/chat/useChatEmotes";
import { useChatMessages } from "@/composable/chat/useChatMessages";
import { useLiveQuery } from "@/composable/useLiveQuery";
import { WorkletEvent, useWorker } from "@/composable/useWorker";
import EmoteSetUpdateMessage from "@/app/chat/msg/EmoteSetUpdateMessage.vue";
import { v4 as uuidv4 } from "uuid";

const { target } = useWorker();
const ctx = useChannelContext();
const channelID = toRef(ctx, "id");
const messages = useChatMessages(ctx);
const emotes = useChatEmotes(ctx);
const { providers } = useStore();

// query the channel's emote set bindings
const channelSets = useLiveQuery(
	() =>
		db.channels
			.where("id")
			.equals(ctx.id)
			.first()
			.then((c) => c?.set_ids ?? []),
	undefined,
	{
		reactives: [channelID],
	},
);

// query the active emote sets
useLiveQuery(
	() =>
		db.emoteSets
			.where("id")
			.anyOf(channelSets.value ?? [])
			.or("scope")
			.equals("GLOBAL")
			.sortBy("priority"),
	(sets) => {
		// reset the third-party emote providers
		emotes.providers["7TV"] = {};
		emotes.providers["FFZ"] = {};
		emotes.providers["BTTV"] = {};

		if (!sets) return;

		for (const set of sets) {
			if (!set.provider || !providers.has(set.provider)) continue;
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
	const { id, emotes_added, emotes_removed, emotes_updated, user } = ev.detail;
	if (!channelSets.value?.includes(id)) return; // not a channel emote set

	const set = emotes.sets[id];

	// Handle added emotes
	for (const emote of emotes_added) {
		emotes.active[emote.name] = emote;
		if (emotes.sets[id]) {
			set.emotes.push(emote);
		}
	}

	// Handle updated emotes
	for (const [o, n] of emotes_updated) {
		if (!n || !o) continue;

		const ae = emotes.find((ae) => ae.id === n.id, true);
		if (!ae) continue;

		const aer = ref(ae);
		for (const k in n) {
			if (k === "data") continue;

			aer.value = { ...aer.value, [k]: n[k as keyof SevenTV.ActiveEmote] };
		}

		delete emotes.active[o.name];
		emotes.active[n.name] = aer.value;
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
		update: emotes_updated,
	});
	messages.add(msg);
}

// This is called when the channel's active emote set is updated
function onActiveSetUpdated(
	connectionIndex: number,
	oldSet: SevenTV.EmoteSet,
	newSet: SevenTV.EmoteSet,
	actor: SevenTV.User,
): void {
	if (!oldSet || !ctx.user) return;

	const conn = ctx.user.connections?.[connectionIndex];
	if (!conn || (conn.emote_set && conn.emote_set.id !== oldSet.id)) return;

	// clear old emote set
	// TODO: this might in rare cases delete active emotes that are still in use by other emote sets
	// some additional such as a parent set check on emotes, may be necessary for stability.
	const oldEmotes = emotes.sets[oldSet.id]?.emotes ?? [];
	for (const emote of oldEmotes) {
		delete emotes.active[emote.name];
	}
	delete emotes.sets[oldSet.id];

	// Trigger DB change on active sets
	conn.emote_set = newSet;
	db.channels
		.where("id")
		.equals(ctx.id ?? "")
		.modify((chMap) => {
			const ind = chMap.set_ids.indexOf(oldSet.id);
			if (ind !== -1) {
				chMap.set_ids.splice(ind, 1, newSet.id);
			} else {
				chMap.set_ids.push(newSet.id);
			}
		});

	// write chat message
	const msg = new ChatMessage(uuidv4());
	msg.setComponent(EmoteSetUpdateMessage, {
		appUser: actor,
		add: [],
		remove: [],
		update: [],
		wholeSet: [oldSet, newSet],
	});
	messages.add(msg);
}

function onTwitchEmoteSetData(ev: WorkletEvent<"twitch_emote_set_data">) {
	if (!emotes.providers.PLATFORM) {
		emotes.providers.PLATFORM = {};
	}

	emotes.providers.PLATFORM[ev.detail.id] = ev.detail;
}

target.addEventListener("emote_set_updated", onEmoteSetUpdated);
target.addEventListener("user_updated", (ev) => {
	const { id, actor, emote_set } = ev.detail;
	if (!id || !emote_set) return;

	onActiveSetUpdated(emote_set.connection_index, emote_set.old_set, emote_set.new_set, actor);
});

// Receive twitch emote sets from the worker
target.addEventListener("twitch_emote_set_data", onTwitchEmoteSetData);

onUnmounted(() => {
	target.removeEventListener("emote_set_updated", onEmoteSetUpdated);
	target.removeEventListener("twitch_emote_set_data", onTwitchEmoteSetData);
});
</script>
