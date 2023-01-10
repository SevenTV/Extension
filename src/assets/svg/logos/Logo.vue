<template>
	<component :is="c" />
</template>

<script setup lang="ts">
import Logo7TV from "@/assets/svg/logos/Logo7TV.vue";
import LogoBTTV from "@/assets/svg/logos/LogoBTTV.vue";
import LogoFFZ from "@/assets/svg/logos/LogoFFZ.vue";
import LogoTwitch from "@/assets/svg/logos/LogoTwitch.vue";

const props = withDefaults(
	defineProps<{
		provider: SevenTV.Provider;
	}>(),
	{ provider: "7TV" },
);

const c = {
	"7TV": Logo7TV,
	FFZ: LogoFFZ,
	BTTV: LogoBTTV,
	TWITCH: LogoTwitch,
}[props.provider.replace("/G", "")];
</script>
