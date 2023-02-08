<template>
	<div ref="boxRef" class="seventv-emote-box" @mouseenter="onShowTooltip" @mouseleave="hide()">
		<img
			v-if="!emote.unicode && emote.data && emote.data.host"
			v-show="srcset"
			class="seventv-chat-emote"
			:srcset="unload ? '' : srcset"
			:alt="emote.name"
			:class="{ blur: hideUnlisted && emote.data?.listed === false }"
			@click="(e) => emit('emote-click', e, emote)"
			@load="onImageLoad"
		/>
		<SingleEmoji
			v-else-if="!unload && emote.id"
			:id="emote.id"
			ref="boxRef"
			:alt="emote.name"
			class="seventv-chat-emote seventv-emoji"
		/>

		<template v-for="e of overlaid" :key="e.id">
			<img
				v-if="e.data && e.data.host"
				class="seventv-chat-emote zero-width-emote"
				:class="{ blur: hideUnlisted && e.data?.listed === false }"
				:srcset="e.data.host.srcset ?? imageHostToSrcset(e.data.host, emote.provider)"
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
import SingleEmoji from "@/assets/svg/emoji/SingleEmoji.vue";

const props = withDefaults(
	defineProps<{
		emote: SevenTV.ActiveEmote;
		overlaid?: Record<string, SevenTV.ActiveEmote> | undefined;
		unload?: boolean;
	}>(),
	{ unload: false },
);

const emit = defineEmits<{
	(event: "emote-click", ev: MouseEvent, ae: SevenTV.ActiveEmote): void;
}>();

const boxRef = ref<HTMLImageElement | HTMLUnknownElement>();

const hideUnlisted = useConfig<boolean>("general.blur_unlisted_emotes");

const src = ref("");
const srcset = ref(props.emote.data?.host.srcset);
if (!srcset.value && props.emote.data?.host) {
	srcset.value = imageHostToSrcset(props.emote.data.host, props.emote.provider, undefined, 2);
}

const imgEl = ref<HTMLImageElement>();
const width = ref(0);
const height = ref(0);

const onImageLoad = (event: Event) => {
	if (!(event.target instanceof HTMLImageElement)) return;

	imgEl.value = event.target;
};

function onShowTooltip() {
	if (imgEl.value && !(width.value && height.value)) {
		width.value = imgEl.value.clientWidth;
		height.value = imgEl.value.clientHeight;
		src.value = imgEl.value.currentSrc;
	}

	show(boxRef.value);
}

const { show, hide } = useTooltip(EmoteTooltip, {
	emote: props.emote,
	initSrc: src,
	overlaid: props.overlaid,
	width: width,
	height: height,
});
</script>

<style scoped lang="scss">
.seventv-emote-box {
	display: grid;
	overflow: clip;
}

svg.seventv-emoji {
	width: 2rem;
	height: 2rem;
}

.seventv-chat-emote {
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
