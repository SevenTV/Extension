<template>
	<div ref="boxRef" class="seventv-emote-box">
		<img
			v-if="!emote.unicode && emote.data && emote.data.host"
			v-show="srcset"
			class="seventv-chat-emote"
			:srcset="unload ? '' : srcset"
			:alt="emote.name"
			:class="{ blur: hideUnlisted && emote.data?.listed === false, loading: !loaded }"
			:width="scaledWidth"
			:height="scaledHeight"
			@load="onImageLoad"
			@mouseenter="onShowTooltip"
			@mouseleave="hide()"
			@click="(ev) => [onShowEmoteCard(ev), emit('emote-click', ev, emote)]"
		/>
		<SingleEmoji
			v-else-if="!unload && emote.id"
			:id="emote.id"
			ref="boxRef"
			:alt="emote.name"
			class="seventv-chat-emote seventv-emoji"
			@mouseenter="onShowTooltip"
			@mouseleave="hide()"
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

		<template v-if="showEmoteCard">
			<UiFloating
				class="seventv-emote-card-float"
				:anchor="boxRef"
				placement="right-end"
				:middleware="[shift({ mainAxis: true, crossAxis: true }), autoPlacement()]"
				:emit-clickout="true"
				@clickout="showEmoteCard = false"
			>
				<EmoteCard :emote="emote" :size="[baseWidth, baseHeight]" />
			</UiFloating>
		</template>
	</div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { imageHostToSrcset } from "@/common/Image";
import { useConfig } from "@/composable/useSettings";
import { useTooltip } from "@/composable/useTooltip";
import EmoteCard from "@/site/global/components/EmoteCard.vue";
import EmoteTooltip from "@/site/twitch.tv/modules/chat/components/message/EmoteTooltip.vue";
import SingleEmoji from "@/assets/svg/emoji/SingleEmoji.vue";
import UiFloating from "@/ui/UiFloating.vue";
import { autoPlacement, shift } from "@floating-ui/dom";

const props = withDefaults(
	defineProps<{
		emote: SevenTV.ActiveEmote;
		clickable?: boolean;
		format?: SevenTV.ImageFormat;
		overlaid?: Record<string, SevenTV.ActiveEmote> | undefined;
		unload?: boolean;
		scale?: number;
	}>(),
	{ unload: false, scale: 1 },
);

const emit = defineEmits<{
	(event: "emote-click", ev: MouseEvent, ae: SevenTV.ActiveEmote): void;
}>();

const hideUnlisted = useConfig<boolean>("general.blur_unlisted_emotes");

const boxRef = ref<HTMLImageElement | HTMLUnknownElement>();
const showEmoteCard = ref(false);
const cardPos = ref<[number, number]>([0, 0]);

const imgEl = ref<HTMLImageElement>();

const src = ref("");
const srcset = ref("");

const loaded = ref(false);

const targetSize = ref(1);
const offsetScale = ref(1);

const baseWidth = ref(0);
const baseHeight = ref(0);

const naturalWidth = ref(0);
const naturalHeight = ref(0);

const scaledWidth = ref(0);
const scaledHeight = ref(0);

watchEffect(() => {
	targetSize.value = Math.ceil(props.scale);
	offsetScale.value = props.scale / targetSize.value;

	if (props.emote.data?.host) {
		if (targetSize.value != 1 || !props.emote.data.host.srcset) {
			srcset.value = imageHostToSrcset(
				props.emote.data.host,
				props.emote.provider,
				undefined,
				2,
				targetSize.value,
			);
		} else {
			srcset.value = props.emote.data.host.srcset;
		}
	}
});

watchEffect(() => {
	scaledWidth.value = naturalWidth.value * offsetScale.value;
	scaledHeight.value = naturalHeight.value * offsetScale.value;
});

const onImageLoad = (event: Event) => {
	if (!(event.target instanceof HTMLImageElement)) return;

	const img = event.target;

	baseWidth.value = Math.round(img.naturalWidth / targetSize.value);
	baseHeight.value = Math.round(img.naturalHeight / targetSize.value);

	naturalWidth.value = img.naturalWidth;
	naturalHeight.value = img.naturalHeight;

	src.value = img.currentSrc;

	imgEl.value = img;

	loaded.value = true;
};

function onShowEmoteCard(ev: MouseEvent) {
	if (!props.clickable) return;

	showEmoteCard.value = true;
	cardPos.value = [ev.clientX, ev.clientY];
}

function onShowTooltip() {
	show(boxRef.value);
}

const { show, hide } = useTooltip(EmoteTooltip, {
	emote: props.emote,
	initSrc: src,
	overlaid: props.overlaid,
	width: baseWidth,
	height: baseHeight,
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

	object-fit: contain;

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

img.loading {
	display: none;
}

.seventv-emote-card-float {
	position: fixed;
}
</style>
