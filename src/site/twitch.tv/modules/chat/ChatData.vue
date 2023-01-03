<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useStore } from "@/store/main";
import { useLiveQuery } from "@/composable/useLiveQuery";
import { useChatAPI } from "@/site/twitch.tv/ChatAPI";
import { db } from "@/db/idb";

const { channel } = storeToRefs(useStore());
const { emoteMap, emoteProviders, cosmetics } = useChatAPI();

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

// query available cosmetics
useLiveQuery(
	() => db.cosmetics.toArray(),
	(res) => (cosmetics.value = res.reduce((a, b) => ({ ...a, [b.id]: b }), {})),
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
</script>
