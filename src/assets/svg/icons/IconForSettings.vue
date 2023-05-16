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
import PuzzlePieceIcon from "./PuzzlePieceIcon.vue";
import SiteLayoutIcon from "./SiteLayoutIcon.vue";
import TvIcon from "./TvIcon.vue";
import VideoIcon from "./VideoIcon.vue";
import YouTubeIcon from "./YouTubeIcon.vue";

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
	Compatibility: PuzzlePieceIcon,
	"Site Layout": SiteLayoutIcon,
	Player: VideoIcon,

	"Enable YouTube": YouTubeIcon,
}[props.name];
</script>
