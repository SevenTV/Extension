<template>
	<img
		ref="imgRef"
		class="chat-emote"
		:srcset="getSrcSet(props.emote)"
		:alt="emote.name"
		@click="openCard"
		@mouseenter="show(imgRef)"
		@mouseleave="hide()"
	/>
	<template v-for="(e, index) of emote.overlaid" :key="index">
		<img class="chat-emote zero-width-emote" :srcset="getSrcSet(e)" :alt="' ' + e.name" />
	</template>
</template>

<script setup lang="ts">
import { useTooltip } from "@/composable/useTooltip";
import { tools } from "@/site/twitch.tv/modules/chat/ChatBackend";
import { ref } from "vue";
import ChatEmoteTooltip from "@/site/twitch.tv/modules/chat/components/ChatEmoteTooltip.vue";

const props = defineProps<{
	emote: SevenTV.ActiveEmote;
}>();

function getSrcSet(emote: SevenTV.ActiveEmote) {
	const host = emote.data?.host ?? { url: "", files: [] };
	return host.files
		.filter((f) => f.format === host.files[0].format)
		.map((f, i) => `${host.url}/${f.name} ${i + 1}x`)
		.join(", ");
}

const imgRef = ref<HTMLElement>();

const { show, hide } = useTooltip(ChatEmoteTooltip, {
	emote: props.emote,
});

const openCard = (ev: MouseEvent) => {
	if (!props.emote.id || props.emote.provider !== "TWITCH") return;

	const rect = (ev.target as HTMLElement).getBoundingClientRect();
	tools.emoteClick({
		emoteID: props.emote.id,
		emoteCode: props.emote.name,
		sourceID: "chat",
		initialTopOffset: rect.bottom,
		initialBottomOffset: rect.top,
	});
};
</script>

<style scoped lang="scss">
img.chat-emote {
	font-weight: 900;
	grid-column: 1;
	grid-row: 1;
	margin: auto;

	&:hover {
		cursor: pointer;
	}
}

img.zero-width-emote {
	pointer-events: none;
}
</style>
