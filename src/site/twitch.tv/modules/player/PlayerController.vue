<template>
	<template v-if="shouldHideContentWarning && contentWarning">
		<PlayerContentWarning v-for="x of contentWarning.instances" :key="x.identifier" :inst="x" />
	</template>
</template>

<script setup lang="ts">
import { onUnmounted, ref, watch, watchEffect } from "vue";
import { debounceFn } from "@/common/Async";
import { HookedInstance, ReactComponentHook, defineComponentHook, unhookComponent } from "@/common/ReactHooks";
import { defineNamedEventHandler, unsetNamedEventHandler, unsetPropertyHook } from "@/common/Reflection";
import { useConfig } from "@/composable/useSettings";
import PlayerContentWarning from "./PlayerContentWarning.vue";

const props = defineProps<{
	inst: HookedInstance<Twitch.VideoPlayerComponent>;
	mediaPlayer?: Twitch.MediaPlayerInstance;
}>();

const shouldHideContentWarning = useConfig<boolean>("player.skip_content_restriction");
const actionOnClick = useConfig<number>("player.action_onclick");

const contentWarning = ref<ReactComponentHook<Twitch.VideoPlayerContentRestriction> | null>(null);
const playerOverlay = ref<HTMLElement | null>(null);

const hookContentWarning = debounceFn((): void => {
	if (contentWarning.value) {
		unhookComponent(contentWarning.value as ReactComponentHook<Twitch.VideoPlayerContentRestriction>);
	}

	contentWarning.value = defineComponentHook<Twitch.VideoPlayerContentRestriction>({
		parentSelector: ".seventv-player",
		predicate: (n) =>
			n.props && typeof n.props.restrictions === "object" && typeof n.props.liftRestriction === "function",
	});
}, 100);

watch(
	shouldHideContentWarning,
	(v) => {
		if (!v) return;

		hookContentWarning();
	},
	{
		immediate: true,
	},
);

watchEffect(() => {
	if (!props.inst.component?.props) return;

	if (props.inst.component.props.containerRef instanceof HTMLDivElement) {
		const e = props.inst.component.props.containerRef;
		if (e) {
			e.classList.toggle("seventv-player-hide-content-warning", shouldHideContentWarning.value);
		}

		props.inst.component.props.containerRef.classList.add("seventv-player");
	}

	if (props.mediaPlayer) {
		const videoElement = props.mediaPlayer.core.mediaSinkManager.video;
		if (!videoElement || !videoElement.nextElementSibling) return;

		playerOverlay.value = (videoElement.nextElementSibling as HTMLElement).querySelector<HTMLElement>(
			"div[data-a-target='player-overlay-click-handler']",
		);
		if (!playerOverlay.value) return;

		if (actionOnClick.value === 1) {
			defineNamedEventHandler(playerOverlay.value, "PlayerActionOnClick", "click", togglePause);
		} else if (actionOnClick.value === 2) {
			defineNamedEventHandler(playerOverlay.value, "PlayerActionOnClick", "click", toggleMute);
		} else {
			unsetNamedEventHandler(playerOverlay.value, "PlayerActionOnClick", "click");
		}
	}
});

function togglePause() {
	if (!props.mediaPlayer) return;

	if (props.mediaPlayer.isPaused()) {
		props.mediaPlayer.play();
	} else {
		props.mediaPlayer.pause();
	}
}

function toggleMute() {
	if (!props.mediaPlayer) return;

	props.mediaPlayer.setMuted(!props.mediaPlayer.isMuted());
}

function defineClickHandler() {
	const mediaPlayer = props.mediaPlayer;
	if (!mediaPlayer) return;
}

// watch for setting changes of the "action"
watch(actionOnClick, defineClickHandler);

onUnmounted(() => {
	if (contentWarning.value) {
		unhookComponent(contentWarning.value as ReactComponentHook<Twitch.VideoPlayerContentRestriction>);
	}
	unsetPropertyHook(props.inst.component.props.mediaPlayerInstance.core.state, "liveLatency");
	unsetPropertyHook(props.inst.component, "props");
	if (playerOverlay.value) unsetNamedEventHandler(playerOverlay.value, "PlayerActionOnClick", "click");
});
</script>

<style lang="scss">
:root {
	.seventv-player.seventv-player-hide-content-warning {
		.disclosure-tool {
			display: none !important;
		}
	}
}
</style>
