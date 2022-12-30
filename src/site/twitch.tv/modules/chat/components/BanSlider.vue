<template>
	<div
		v-if="shouldModerate(props.msg)"
		class="seventv-ban-slider"
		:style="{
			transform: 'translateX(' + data.pos + ')',
			transition: transition ? 'transform 0.3s ease' : 'none',
			boxShadow: tracking ? 'black 0px 0.1rem 0.2rem' : 'none',
		}"
	>
		<div class="ban-background" :style="{ backgroundColor: data.color, width: data.pos }">
			<span class="text" :style="{ opacity: data.banVis }">
				{{ data.text }}
			</span>
		</div>
		<div class="grabbable-wrapper">
			<div class="grabbable-outer" @pointerdown="handleDown" @pointerup="handleRelease" @pointermove="update">
				<div class="grabbable-inner">
					<div class="dots" />
				</div>
			</div>
		</div>
		<!-- The wrapped object-->
		<slot />
		<div class="unban-background" :style="{ width: 'calc(-1 *' + data.pos + ')' }">
			<span class="text" :style="{ opacity: data.unbanVis }"> Unban </span>
		</div>
	</div>
	<slot v-else />
</template>

<script setup lang="ts">
import { useChatAPI } from "@/site/twitch.tv/ChatAPI";
import { ref, toRefs } from "vue";
import { sliderData, maxVal } from "./BanSliderBackend";

const props = defineProps<{
	msg: Twitch.ChatMessage;
}>();

const { isModerator, sendMessage } = toRefs(useChatAPI());

const transition = ref(false);
const tracking = ref(false);

const data = ref(new sliderData(0));
let initial = 0;

function shouldModerate(msg: Twitch.ChatMessage) {
	return (
		(isModerator.value &&
			msg.badges &&
			!("moderator" in msg.badges) &&
			!("broadcaster" in msg.badges) &&
			!("staff" in msg.badges)) ??
		false
	);
}

function executeModAction(message: string, name: string, id: string) {
	sendMessage.value(message.replace("{user}", name).replace("{id}", id));
}

const handleDown = (e: PointerEvent) => {
	e.stopPropagation();
	initial = e.pageX;
	tracking.value = true;
	(e.target as HTMLElement).setPointerCapture(e.pointerId);
};

const handleRelease = (e: PointerEvent): void => {
	tracking.value = false;

	if (data.value.command) {
		executeModAction(data.value.command, props.msg.user.userLogin, props.msg.id);
	}

	transition.value = true;
	setTimeout(() => (transition.value = false), 300);

	data.value = new sliderData(0);
	(e.target as HTMLElement).releasePointerCapture(e.pointerId);
};

const update = (e: PointerEvent): void => {
	if (!tracking.value) return;
	e.preventDefault();

	const calcPos = Math.max(Math.min(e.pageX - initial, maxVal), -60);

	data.value = new sliderData(calcPos);
};
</script>

<style scoped lang="scss">
.transition {
	transition: transform 0.3s ease;
}

%background {
	position: absolute;
	top: 0;
	box-shadow: inset 0.1em 0.1em 0.4em black;
	display: flex;
	align-items: center;
	overflow: hidden;
	height: 100%;
	transition: background-color 0.2s ease;
	.text {
		position: relative;
		white-space: nowrap;
		width: 100%;
		text-align: center;
		text-shadow: 0.1em 0 0.2rem var(--color-background-body), 0 0.1em 0.2rem var(--color-background-body),
			-0.1em 0 0.2rem var(--color-background-body), 0 -0.1em 0.2rem var(--color-background-body);
		transition: opacity 0.2s ease;
	}
}
.unban-background {
	@extend %background;
	left: 100%;
	background-color: green;
}

.ban-background {
	@extend %background;
	right: 100%;
}

.grabbable-wrapper {
	width: 0;
	height: 100%;
	position: absolute;
	.grabbable-outer {
		height: 100%;
		display: inline-flex;
		padding: 0.5rem 0;
		width: 2rem;
		pointer-events: all;
		cursor: grab;

		.grabbable-inner {
			height: 100%;
			border: 0.1rem outset var(--color-border-input);
			border-radius: 0 0.3rem 0.3rem 0;
			display: inline-flex;
			align-items: center;
			border-left: none;
			box-shadow: 0 0 0.4rem black;
			.dots {
				background-image: radial-gradient(circle, var(--color-border-input) 0.1rem, transparent 0.2rem);
				background-size: 100% 33.33%;
				height: 1.4rem;
				width: 0.6rem;
			}
		}
	}
}
</style>
