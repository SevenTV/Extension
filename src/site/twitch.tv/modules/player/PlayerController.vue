<template>
	<template v-if="shouldHideContentWarning && contentWarning">
		<PlayerContentWarning v-for="x of contentWarning.instances" :key="x.identifier" :inst="x" />
	</template>
</template>
1

<script setup lang="ts">
import { onUnmounted, ref, watch, watchEffect } from "vue";
import { debounceFn } from "@/common/Async";
import { HookedInstance, ReactComponentHook, defineComponentHook, unhookComponent } from "@/common/ReactHooks";
import { definePropertyHook } from "@/common/Reflection";
import { useConfig } from "@/composable/useSettings";
import PlayerContentWarning from "./PlayerContentWarning.vue";

const props = defineProps<{
	inst: HookedInstance<Twitch.VideoPlayerComponent>;
}>();

const shouldHideContentWarning = useConfig<boolean>("player.skip_content_restriction");
const contentWarning = ref<ReactComponentHook<Twitch.VideoPlayerContentRestriction> | null>(null);

props.inst.component.props.containerRef.classList.add("seventv-player");

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

definePropertyHook(props.inst.component, "props", {
	value() {
		hookContentWarning();
	},
});

watchEffect(() => {
	const e = props.inst.component.props.containerRef as HTMLDivElement;
	if (!e) return;

	e.classList.toggle("seventv-player-hide-content-warning", shouldHideContentWarning.value);
});

onUnmounted(() => {
	if (contentWarning.value) {
		unhookComponent(contentWarning.value as ReactComponentHook<Twitch.VideoPlayerContentRestriction>);
	}
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
