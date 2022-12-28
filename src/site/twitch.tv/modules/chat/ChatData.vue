<script setup lang="ts">
import { db } from "@/db/IndexedDB";
import { useStore } from "@/store/main";
import { useChatAPI } from "@/site/twitch.tv/ChatAPI";
import { useLiveQuery } from "@/composable/useLiveQuery";
import { storeToRefs } from "pinia";
import { toRefs } from "vue";

const { channel } = storeToRefs(useStore());
const { emoteMap } = toRefs(useChatAPI());
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

		emoteMap.value = o;
	},
);
</script>
