<template>
	<div class="emote-box">
		<img
			v-if="srcSet"
			ref="imgRef"
			class="chat-emote"
			:srcset="srcSet"
			:alt="emote.name"
			:class="{ blur: hideUnlisted && emote.data?.listed === false }"
			@click="openCard"
			@mouseenter="show(imgRef)"
			@mouseleave="hide()"
		/>
		<template v-for="(e, index) of emote.overlaid" :key="index">
			<img
				class="chat-emote zero-width-emote"
				:class="{ blur: hideUnlisted && e.data?.listed === false }"
				:srcset="getSrcSet(e)"
				:alt="' ' + e.name"
			/>
		</template>
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useConfig } from "@/composable/useSettings";
import { useTooltip } from "@/composable/useTooltip";
import { tools } from "@/site/twitch.tv/modules/chat/ChatBackend";
import EmoteTooltip from "@/site/twitch.tv/modules/chat/components/message/EmoteTooltip.vue";

const props = withDefaults(
	defineProps<{
		emote: SevenTV.ActiveEmote;
		imageFormat?: SevenTV.ImageFormat;
		unload?: boolean;
	}>(),
	{ unload: false, imageFormat: "WEBP" },
);

const srcSet = computed(() => (props.unload ? "" : getSrcSet(props.emote)));

function getSrcSet(emote: SevenTV.ActiveEmote) {
	const host = emote.data?.host ?? { url: "", files: [] };
	const format = host.files.some((fi) => fi.format === props.imageFormat) ? props.imageFormat : host.files[0]?.format;

	return host.files
		.filter((f) => f.format === format)
		.map((f, i) => `${host.url}/${f.name} ${i + 1}x`)
		.join(", ");
}

const imgRef = ref<HTMLElement>();

const { show, hide } = useTooltip(EmoteTooltip, {
	emote: props.emote,
});

const hideUnlisted = useConfig<boolean>("general.blur_unlisted_emotes");

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
.emote-box {
	display: grid;
	overflow: clip;
}
img.chat-emote {
	font-weight: 900;
	grid-column: 1;
	grid-row: 1;
	margin: auto;

	&:hover {
		cursor: pointer;
	}
}

img.blur {
	filter: blur(16px);
	overflow: clip;
}

img.zero-width-emote {
	pointer-events: none;
}
</style>
