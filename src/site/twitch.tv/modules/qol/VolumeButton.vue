<template>
	<div v-if="enabled" v-tooltip="'Emote Volume'" class="seventv-tw-button volume-button" @click="onClick">
		<button>
			<VolumeMutedIcon v-if="muted" class="icon" :class="{ seen }" />
			<VolumeIcon v-else class="icon" :class="{ seen }" />
		</button>
	</div>
</template>

<script setup lang="ts">
import { Ref } from "vue";
import VolumeIcon from "@/assets/svg/icons/VolumeIcon.vue";
import VolumeMutedIcon from "@/assets/svg/icons/VolumeMutedIcon.vue";

defineProps<{
	enabled: Ref<boolean>;
	muted: Ref<boolean>;
	seen: Ref<boolean>;
	onClick: () => void;
}>();
</script>

<style scoped lang="scss">
@import "@/assets/style/tw-tooltip.scss";

@keyframes unseen-wiggle {
	0% {
		transform: rotate(0deg);
	}
	5% {
		transform: rotate(-17deg);
	}
	10% {
		transform: rotate(17deg);
	}
	15% {
		transform: rotate(-17deg);
	}
	20% {
		transform: rotate(17deg);
	}
	25% {
		transform: rotate(0deg);
	}
}

.icon:not(.seen) {
	animation: infinite 3.4s unseen-wiggle;
}
</style>
