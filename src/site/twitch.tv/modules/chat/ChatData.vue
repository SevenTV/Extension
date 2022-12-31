<script setup lang="ts">
import { db } from "@/db/IndexedDB";
import { useStore } from "@/store/main";
import { useChatAPI } from "@/site/twitch.tv/ChatAPI";
import { useLiveQuery } from "@/composable/useLiveQuery";
import { storeToRefs } from "pinia";

const { channel } = storeToRefs(useStore());
const { emoteMap, emoteProviders } = useChatAPI();
const id = channel.value?.id ?? "";

// query the channel's emote set bindings
const channelSets = useLiveQuery(() =>
	db.channels
		.where("id")
		.equals(id)
		.first()
		.then((c) => c?.set_ids ?? []),
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
		reactives: [channel],
	},
);
</script>
