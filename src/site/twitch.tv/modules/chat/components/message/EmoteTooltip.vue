<template>
	<template v-if="compactTooltips">
		<div ref="tooltip" class="seventv-tooltip-compact" tooltip-type="emote">
			<p>{{ emote.name }}</p>
		</div>
	</template>
	<template v-else>
		<div ref="tooltip" class="seventv-tooltip" tooltip-type="emote">
			<img
				v-if="emote.provider !== 'EMOJI'"
				ref="imgRef"
				class="tooltip-emote"
				:src="initSrc"
				:srcset="srcset"
				:alt="emote.name"
				sizes="auto"
				:style="{
					width,
					height,
				}"
			/>
			<SingleEmoji v-else :id="emote.id" class="tooltip-emoji" />

			<div class="details">
				<h3 class="emote-name">{{ emote.name }}</h3>
				<Logo class="logo" :provider="emote.provider" />
			</div>

			<!-- Alias Labels -->
			<div v-if="emote.data && emote.data.name !== emote.name" class="alias-label">
				aka <span>{{ emote.data?.name }}</span>
			</div>

			<!-- Creator -->
			<div v-if="emote.data?.owner" class="creator-label">
				by
				<span
					class="creator-name"
					:style="{
						color: creatorColor,
					}"
				>
					{{ emote.data.owner.display_name }}
				</span>
			</div>

			<!-- Labels -->
			<div class="scope-labels">
				<div v-if="isGlobal" class="label-global">Global Emote</div>
				<div v-if="isSubscriber" class="label-subscriber">Subscriber Emote</div>
				<div v-if="isChannel" class="label-channel">Channel Emote</div>
				<div v-if="isPersonal" class="label-personal">Personal Emote</div>
			</div>

			<!-- Emoji Data -->
			<div v-if="emojiData">
				<div>Emoji - {{ emojiData.group }}</div>
			</div>

			<!-- Zero Width -->
			<div v-if="hasOverlayEmotes" class="divider" />
			<div v-if="hasOverlayEmotes" class="zero-width-label">
				<div v-for="e in overlayEmotes" :key="e.id" class="zero-width-emote">
					<img
						v-if="e.data"
						class="overlaid-emote-icon"
						:srcset="e.data.host.srcset ?? imageHostToSrcset(e.data.host, e.provider)"
					/>
					—
					<span>{{ e.name }}</span>
				</div>
			</div>
		</div>
	</template>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useTimeoutFn } from "@vueuse/shared";
import { DecimalToStringRGBA } from "@/common/Color";
import { imageHostToSrcset, imageHostToSrcsetWithsize } from "@/common/Image";
import { Emoji, useEmoji } from "@/composable/useEmoji";
import { useConfig } from "@/composable/useSettings";
import SingleEmoji from "@/assets/svg/emoji/SingleEmoji.vue";
import Logo from "@/assets/svg/logos/Logo.vue";

const props = defineProps<{
	emote: SevenTV.ActiveEmote;
	initSrc?: string;
	overlaid?: Record<string, SevenTV.ActiveEmote> | undefined;
	height: number;
	width: number;
}>();

const compactTooltips = useConfig("ui.compact_tooltips");

const srcset = ref("");

// set a time buffer before loading the full size
// (this is to prevent the tooltip from loading the full size image when the user is just moving the cursor around)
if (props.emote && props.emote.data && props.emote.data.host.srcset) {
	useTimeoutFn(() => {
		srcset.value = imageHostToSrcsetWithsize(
			props.height,
			props.width,
			props.emote.data!.host,
			props.emote.provider,
		);
	}, 90);
}

const overlayEmotes = ref(props.overlaid ?? {});
const hasOverlayEmotes = ref(Object.keys(overlayEmotes.value).length > 0);
const width = `${props.width * 3}px`;
const height = `${props.height * 3}px`;

const isGlobal = props.emote.scope === "GLOBAL";
const isSubscriber = props.emote.scope === "SUB";
const isChannel = props.emote.scope === "CHANNEL";
const isPersonal = props.emote.scope === "PERSONAL";

const emojiData = ref<Emoji | null>(null);
if (props.emote.unicode) {
	const { emojiByCode } = useEmoji();

	emojiData.value = emojiByCode.get(props.emote.unicode) ?? null;
}

const creatorColor = ref("inherit");
if (props.emote.data?.owner?.style?.color) {
	creatorColor.value = DecimalToStringRGBA(props.emote.data.owner.style.color);
}
</script>

<style scoped lang="scss">
.seventv-tooltip {
	display: flex;
	flex-direction: column;
	align-items: center;
	max-width: 21em;
	padding: 0.5em 1.15em;
}

.seventv-tooltip-compact {
	background-color: rgba(0, 0, 0, 0.65%);
	@at-root .seventv-transparent & {
		backdrop-filter: blur(0.25em);
	}
	border-radius: 0.33em;
	padding: 0.25em;
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
	flex-shrink: 0;
	align-self: end;
}

img.tooltip-emote {
	margin-bottom: 1rem;
}

svg.tooltip-emoji {
	max-width: 8rem;
	max-height: 8rem;
}

.details {
	display: flex;
	column-gap: 0.5rem;
	flex: 1;

	> h3 {
		font-weight: 600;
	}
}

.divider {
	width: 65%;
	height: 0.01em;
	background-color: currentColor;
	opacity: 0.15;
	margin-top: 0.5rem;
	margin-bottom: 0.5rem;
}

.creator-label {
	font-size: 1.3rem;
}

.zero-width-label {
	display: block;
	gap: 0.25rem;
	font-size: 1.3rem;
	font-weight: 600;

	.zero-width-emote {
		display: flex;
	}

	.overlaid-emote-icon {
		display: flex;
		flex-direction: row;
		width: 1.5rem;
	}
}

.scope-labels {
	font-size: 1.3rem;
	font-weight: 600;
	> .label-global {
		color: rgb(70, 220, 100);
	}

	> .label-personal {
		color: rgb(220, 170, 50);
	}
}
</style>
