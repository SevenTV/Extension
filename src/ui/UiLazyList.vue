<template>
	<template v-if="show">
		<slot />
	</template>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useTimeoutFn } from "@vueuse/shared";
import { useUiLazy } from "./UiLazy";

const props = defineProps<{
	inst: symbol | string;
	incr?: number;
}>();

const { increment } = useUiLazy(props.inst);
const show = ref(false);

if (props.inst) {
	useTimeoutFn(() => {
		show.value = true;
	}, increment(props.incr));
}
</script>
