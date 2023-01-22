<template>
	<template v-if="ok">
		<slot />
	</template>
</template>

<script setup lang="ts">
import { nextTick, ref } from "vue";

const ok = ref(false);

nextTick(() => {
	ok.value = true;
});
</script>
