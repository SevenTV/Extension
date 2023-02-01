<template>
	<template v-for="{ id, data } of objects" :key="id">
		<!-- eslint-disable-next-line vue/no-v-html -->
		<div class="seventv-emoji-block" v-html="data" />
	</template>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { until, useTimeout } from "@vueuse/shared";
import { getRandomInt } from "@/common/Rand";

const vectorMap = import.meta.glob("@/assets/blob/emoji*.svg", { as: "raw" });

const objects = ref<{ id: string; data: string }[]>([]);

(async () => {
	for (const [key, value] of Object.entries(vectorMap)) {
		const id = key.split("/").pop()?.split(".")[0] ?? "";
		const data = await value();

		objects.value.push({ id, data });

		// Pad some time between loading each chunk to avoid occupying the ui thread for too long
		await until(useTimeout(getRandomInt(250, 1000))).toBeTruthy();
	}
})();
</script>

<style scoped lang="scss">
.seventv-emoji-block {
	display: none;
	position: fixed;
	top: -1px;
	left: -1px;
	height: 0;
	width: 0;
}
</style>
