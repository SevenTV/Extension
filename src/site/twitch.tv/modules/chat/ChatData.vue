<script setup lang="ts">
import { db } from "@/db/IndexedDB";
import { useStore } from "@/store/main";
import { liveQuery } from "dexie";
import { storeToRefs } from "pinia";
import { reactive, watch } from "vue";
import { useTwitchStore } from "@/site/twitch.tv/TwitchStore";

const { channel } = storeToRefs(useStore());
const twitchStore = useTwitchStore();
const setMap = reactive({
	twitch: [] as SevenTV.EmoteSet[],
});

// watch for changes and remap emotes
watch(setMap, () => {
	for (let i = 0; i < setMap.twitch.length; i++) {
		const set = setMap.twitch[i];

		for (let i2 = 0; i2 < set.emotes.length; i2++) {
			const e = set.emotes[i2];

			twitchStore.emoteMap[e.name] = e;
		}
	}
});

// Query 7TV Emotes
liveQuery(() =>
	db.userConnections
		.where({
			id: channel.value?.id,
		})
		.first(),
).subscribe({
	next(conn) {
		if (!conn) return;

		for (const emote of conn.emote_set.emotes) {
			twitchStore.emoteMap[emote.name] = emote;
		}
	},
});
</script>
