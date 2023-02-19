<template>
	<component :is="c" />
</template>

<script setup lang="ts">
import BellsIcon from "./BellsIcon.vue";
import ChatIcon from "./ChatIcon.vue";
import EmotesIcon from "./EmotesIcon.vue";
import GearsIcon from "./GearsIcon.vue";
import HomeIcon from "./HomeIcon.vue";
import PaintIcon from "./PaintIcon.vue";
import TvIcon from "./TvIcon.vue";

const props = withDefaults(
	defineProps<{
		name: string;
	}>(),
	{ name: "general" },
);

const c = {
	Home: HomeIcon,
	Chat: ChatIcon,
	Emotes: EmotesIcon,
	Appearance: PaintIcon,
	Highlights: BellsIcon,
	General: GearsIcon,
	Channel: TvIcon,
}[props.name];
</script>
