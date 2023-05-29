<template>
	<div v-if="isEnabled" class="seventv-tw-button seventv-emote-menu-button" @click="onClick">
		<button>
			<Logo provider="7TV" class="icon" />
		</button>
		<span class="tooltip-over">Emote Menu</span>
		<div v-if="!updater.isUpToDate && !ctx.open" class="seventv-emote-menu-update-flair" />
	</div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useConfig } from "@/composable/useSettings";
import useUpdater from "@/composable/useUpdater";
import Logo from "@/assets/svg/logos/Logo.vue";
import { useEmoteMenuContext } from "@/app/emote-menu/EmoteMenuContext";

defineProps<{
	onClick?: () => void;
}>();

const ctx = useEmoteMenuContext();
const updater = useUpdater();
const isEnabled = ref(false);
const placement = useConfig<string>("ui.emote_menu.button_placement");

watch(
	placement,
	(v) => {
		isEnabled.value = v === "below";
	},
	{ immediate: true },
);
</script>

<style scoped lang="scss">
@import "@/assets/style/tw-tooltip";
@import "@/assets/style/flair";

.seventv-emote-menu-update-flair {
	position: absolute;
	top: 0.5rem;
	right: 0.5rem;
	width: 0.75rem;
	height: 0.75rem;

	@include flair-pulsating(#3eed58);
}

.seventv-tw-button.seventv-emote-menu-button {
	svg {
		width: 100%;
		height: 100%;
	}
}
</style>
