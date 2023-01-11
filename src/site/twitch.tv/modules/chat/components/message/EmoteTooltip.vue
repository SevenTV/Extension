<template>
	<div ref="tooltip" class="seventv-tooltip" tooltip-type="emote">
		<img ref="imgRef" class="tooltip-emote" :srcset="srcSet" :alt="emote.name" />

		<div class="details">
			<h3 class="emote-name">{{ emote.name }}</h3>
			<div class="spacer"></div>
			<Logo class="logo" :provider="emote.provider" />
		</div>

		<!-- Creator -->
		<div v-if="emote.data?.owner" class="creator-label">
			by
			<span class="creator-name">{{ emote.data.owner.display_name }}</span>
		</div>

		<!-- Labels -->
		<div class="labels">
			<div v-if="isGlobal" class="label-global">Global Emote</div>
			<div v-if="isSubscriber" class="label-subscriber">Subscriber Emote</div>
			<div v-if="isChannel" class="label-channel">Channel Emote</div>
			<div v-if="isPersonal" class="label-personal">Personal Emote</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { DecimalToStringRGBA } from "@/common/Color";
import { imageHostToSrcset } from "@/common/Image";
import Logo from "@/assets/svg/logos/Logo.vue";

const props = withDefaults(
	defineProps<{
		emote: SevenTV.ActiveEmote;
		imageFormat?: SevenTV.ImageFormat;
		unload?: boolean;
		height: number;
		width: number;
	}>(),
	{ unload: false, imageFormat: "WEBP" },
);

const srcSet = computed(() => (props.unload ? "" : imageHostToSrcset(props.emote.data!.host, props.imageFormat)));
const width = computed(() => `${props.width * 3}px`);
const height = computed(() => `${props.height * 3}px`);

const isGlobal = computed(() => props.emote.scope === "GLOBAL");
const isSubscriber = computed(() => props.emote.scope === "SUB");
const isChannel = computed(() => props.emote.scope === "CHANNEL");
const isPersonal = computed(() => props.emote.scope === "PERSONAL");

const creatorColor = computed(() => {
	if (!props.emote.data || !props.emote.data.owner) return "inherit";
	if (!props.emote.data.owner.style?.color) return "inherit";

	return DecimalToStringRGBA(props.emote.data.owner.style.color);
});
</script>

<style scoped lang="scss">
.seventv-tooltip {
	display: flex;
	flex-direction: column;
	align-items: center;
	max-width: 21em;
	padding: 0.5em 1.15em;
}

.emote-name {
	font-size: 1.5rem;
	font-weight: 300;
	max-width: 21em;
	word-break: break-all;
	float: left;
}

.logo {
	width: 2rem;
	height: auto;
	float: right;
	align-self: end;
}

img.tooltip-emote {
	margin-bottom: 1rem;
	width: v-bind("width");
	height: v-bind("height");
}

.details {
	display: flex;
	column-gap: 0.25rem;
	flex: 1;

	> h3 {
		font-weight: 600;
	}
}

.creator-label {
	font-size: 0.9rem;

	.creator-name {
		color: v-bind("creatorColor");
	}
}

.labels {
	font-size: 0.9rem;
	> .label-global {
		color: rgb(70, 220, 100);
	}
}
</style>
