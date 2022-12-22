<script setup lang="ts">
import { db } from "@/db/IndexedDB";
import { useStore } from "@/store/main";
import { storeToRefs } from "pinia";
import { useTwitchStore } from "@/site/twitch.tv/TwitchStore";
import { useLiveQuery } from "@/composable/useLiveQuery";

const { channel } = storeToRefs(useStore());
const twitchStore = useTwitchStore();
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
	undefined,
	(sets) => {
		if (!sets) return;

		const o = {} as Record<SevenTV.ObjectID, SevenTV.ActiveEmote>;
		for (const emote of sets.flatMap((set) => set.emotes)) {
			o[emote.name] = emote;
		}

		twitchStore.emoteMap = o;
	},
);
</script>
