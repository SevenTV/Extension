<template>
	<img
		ref="imgRef"
		class="chat-emote"
		:srcset="srcset"
		:alt="emote.name"
		@click="openCard"
		@mouseenter="show(imgRef)"
		@mouseleave="hide()"
	/>
</template>

<script setup lang="ts">
import { useTooltip } from "@/composable/useTooltip";
import { tools } from "@/site/twitch.tv/modules/chat/ChatBackend";
import { ref } from "vue";
import ChatEmoteTooltip from "@/site/twitch.tv/modules/chat/components/ChatEmoteTooltip.vue";

const props = defineProps<{
	emote: SevenTV.ActiveEmote;
	format: SevenTV.ImageFormat;
}>();

const host = props.emote.data?.host ?? { url: "", files: [] };
const srcset = host.files
	.filter((f) => f.format === host.files[0].format)
	.map((f, i) => `${host.url}/${f.name} ${i + 1}x`)
	.join(", ");

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
	vertical-align: middle;
	color: red;
	font-weight: 900;

	&:hover {
		cursor: pointer;
	}
}
</style>
