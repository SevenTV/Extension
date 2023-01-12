<template>
	<div class="emote-box">
		<img
			v-if="emote.data && emote.data.host"
			ref="imgRef"
			class="chat-emote"
			:srcset="imageHostToSrcset(emote.data.host)"
			:alt="emote.name"
			:class="{ blur: hideUnlisted && emote.data?.listed === false }"
			@click="(e) => emit('emoteClick', e, emote)"
			@load="onImageLoad"
			@mouseenter="show(imgRef)"
			@mouseleave="hide()"
		/>
		<template v-for="(e, index) of emote.overlaid" :key="index">
			<img
				v-if="e.data && e.data.host"
				class="chat-emote zero-width-emote"
				:class="{ blur: hideUnlisted && e.data?.listed === false }"
				:srcset="imageHostToSrcset(e.data.host)"
				:alt="' ' + e.name"
			/>
		</template>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { imageHostToSrcset } from "@/common/Image";
import { useConfig } from "@/composable/useSettings";
import { useTooltip } from "@/composable/useTooltip";
import EmoteTooltip from "@/site/twitch.tv/modules/chat/components/message/EmoteTooltip.vue";

const props = withDefaults(
	defineProps<{
		emote: SevenTV.ActiveEmote;
		imageFormat?: SevenTV.ImageFormat;
		unload?: boolean;
	}>(),
	{ unload: false, imageFormat: "WEBP" },
);

const emit = defineEmits<{
	(event: "emoteClick", e: MouseEvent, emote: SevenTV.ActiveEmote): void;
}>();

const imgRef = ref<HTMLImageElement>();

const hideUnlisted = useConfig<boolean>("general.blur_unlisted_emotes");

const width = ref(0);
const height = ref(0);

const onImageLoad = (event: Event) => {
	if (!(event.target instanceof HTMLImageElement)) return;

	width.value = event.target.naturalWidth;
	height.value = event.target.naturalHeight;
};

const { show, hide } = useTooltip(EmoteTooltip, {
	emote: props.emote,
	width: width,
	height: height,
});
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
