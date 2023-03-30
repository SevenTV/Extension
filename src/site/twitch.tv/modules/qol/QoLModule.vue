<template>
	<template v-for="inst of instances" :key="inst.identifier">
		<QoL v-if="enabled && seen" :channel-id="inst.component.props.channelID" />
		<UiFloating
			v-if="showVolume"
			placement="top"
			:anchor="(buttonRef.current as HTMLDivElement)"
			:middleware="[offset(3), shift({ mainAxis: true, crossAxis: true })]"
			:emit-clickout="true"
			@clickout="showVolume = false"
		>
			<VolumeSlider
		/></UiFloating>
	</template>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { until } from "@vueuse/shared";
import { declareModule, getModule } from "@/composable/useModule";
import { declareConfig, useConfig, useSettings } from "@/composable/useSettings";
import QoL from "./QoL.vue";
import VolumeButton from "./VolumeButton.vue";
import VolumeSlider from "./VolumeSlider.vue";
import UiFloating from "@/ui/UiFloating.vue";
import { shift, offset } from "@floating-ui/core";
import useUpdater from "@/composable/useUpdater";

const { dependenciesMet, markAsReady } = declareModule("qol", {
	name: "Quality of Life",
	depends_on: ["chat", "chat-input-controller"],
});

const settings = useSettings();
const updater = useUpdater();

const enabledConfig = useConfig<boolean>("tomfoolery_2023.enabled");
const seen = useConfig<boolean>("tomfoolery_2023.seen");
const volume = useConfig<number>("tomfoolery_2023.volume");

const enabled = computed(() => updater.isDank && enabledConfig.value);

const showVolume = ref(false);
const muted = computed(() => volume.value == 0 || !seen.value);

defineExpose({
	enabled,
	seen,
	volume,
});

await until(dependenciesMet).toBe(true);

const inputController = getModule("chat-input-controller");
if (!inputController?.instance) throw new Error("ChatInputController not found");

const chat = getModule("chat");
if (!chat?.instance) throw new Error("ChatController not found");

// insert button
const buttonRef = inputController.instance.addButton(
	"emote-volume",
	VolumeButton,
	{
		enabled,
		muted,
		seen,
		onClick: () => {
			if (!seen.value) seen.value = true;
			showVolume.value = !showVolume.value;
		},
	},
	99,
);

watch(enabled, (v) => {
	if (!v) showVolume.value = false;
});

watch(
	() => updater.isDank,
	(dank) => {
		if (dank) {
			settings.nodes["tomfoolery_2023.enabled"].path = ["General", ""];
		} else {
			settings.nodes["tomfoolery_2023.enabled"].path = undefined;
		}
	},
);

const instances = chat.instance.chatController.instances;

markAsReady();
</script>

<script lang="ts">
export const config = [
	declareConfig("tomfoolery_2023.enabled", "TOGGLE", {
		label: "Enable Emote Sounds",
		hint: "Enable emote sound effect functionality in chat",
		defaultValue: true,
	}),
	declareConfig("tomfoolery_2023.seen", "NONE", {
		label: "",
		defaultValue: false,
	}),
	declareConfig("tomfoolery_2023.volume", "NONE", {
		label: "",
		defaultValue: 0.5,
	}),
];
</script>
