<template />

<script setup lang="ts">
import { onMounted, toRaw } from "vue";
import { log } from "@/common/Logger";
import { HookedInstance } from "@/common/ReactHooks";

const props = defineProps<{
	inst: HookedInstance<Twitch.VideoPlayerComponent>;
}>();

function getQualityKey(quality: string | Twitch.VideoQuality | undefined): string {
	if (!quality) return "";
	if (typeof quality === "string") return quality;
	return quality.group || quality.name || "";
}

function matchesQuality(current: string | Twitch.VideoQuality | undefined, quality: Twitch.VideoQuality): boolean {
	const currentKey = getQualityKey(current);
	return currentKey === getQualityKey(quality) || currentKey === quality.name;
}

function compareQualities(a: Twitch.VideoQuality, b: Twitch.VideoQuality): number {
	const aIsSource = a.variantSource === "source";
	const bIsSource = b.variantSource === "source";

	if (aIsSource !== bIsSource) {
		return aIsSource ? -1 : 1;
	}
	if (a.height !== b.height) {
		return b.height - a.height;
	}
	if (a.framerate !== b.framerate) {
		return b.framerate - a.framerate;
	}

	return b.bitrate - a.bitrate;
}

function applyBestQuality(player: Twitch.MediaPlayerInstance) {
	try {
		const rawPlayer = toRaw(player);
		const qualities = rawPlayer.getQualities().map(toRaw);
		const [best] = qualities.filter((q) => q.name !== "auto").sort(compareQualities);
		if (!best) {
			return;
		}

		const current = rawPlayer.getQuality();
		if (matchesQuality(current, best)) {
			return;
		}

		if (rawPlayer.isAutoQualityMode()) {
			rawPlayer.setAutoQualityMode(false);
		}

		rawPlayer.setQuality(best);
	} catch (err) {
		log.error("<Player>", "<ForceHD> applyBestQuality failed", String(err));
	}
}

function sync() {
	// Defer this update so browser can prioritize more important tasks
	requestIdleCallback(
		() => {
			applyBestQuality(props.inst.component.props.mediaPlayerInstance);
		},
		// 1 second max delay for some guarantees
		{ timeout: 1000 },
	);
}

onMounted(() => {
	sync();
});

defineExpose({ sync });
</script>
