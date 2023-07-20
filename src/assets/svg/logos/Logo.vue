<template>
	<component :is="c" />
</template>

<script setup lang="ts">
import { useStore } from "@/store/main";
import Logo7TV from "@/assets/svg/logos/Logo7TV.vue";
import LogoBTTV from "@/assets/svg/logos/LogoBTTV.vue";
import LogoFFZ from "@/assets/svg/logos/LogoFFZ.vue";
import LogoTwitch from "@/assets/svg/logos/LogoTwitch.vue";
import LogoKick from "./LogoKick.vue";
import EmojiIcon from "../icons/EmojiIcon.vue";

const props = withDefaults(
	defineProps<{
		provider: SevenTV.Provider;
	}>(),
	{ provider: "7TV" },
);

const { platform } = useStore();

const c = {
	"7TV": Logo7TV,
	FFZ: LogoFFZ,
	BTTV: LogoBTTV,
	PLATFORM: (
		{
			TWITCH: LogoTwitch,
			YOUTUBE: LogoTwitch,
			KICK: LogoKick,
		} as Record<Platform, AnyInstanceType>
	)[platform],
	EMOJI: EmojiIcon,
}[props.provider];
</script>
