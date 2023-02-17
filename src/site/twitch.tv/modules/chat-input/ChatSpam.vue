<template />

<script setup lang="ts">
import { onUnmounted, watch } from "vue";
import { UNICODE_TAG_0, UNICODE_TAG_0_REGEX } from "@/common/Constant";
import { getModuleRef } from "@/composable/useModule";

const chatModule = getModuleRef("chat");

let alt = false;
let prevMessage = "";
function handleDuplicateMessage(content: string): string {
	if (typeof content === "string" && content === prevMessage) {
		// Remove existing unicode tags
		// avoids conflict with other extensions
		content = content.replace(UNICODE_TAG_0_REGEX, "");

		// Set alternate unicode tag suffix
		alt = !alt;
		if (alt) {
			content += " " + UNICODE_TAG_0;
		}
	} else {
		alt = false;
	}

	prevMessage = content;

	return content;
}

function resetMiddleware(): void {
	if (!chatModule.value.instance) return;

	const currentInd = chatModule.value.instance.messageSendMiddleware.indexOf(handleDuplicateMessage);
	if (currentInd !== -1) chatModule.value.instance.messageSendMiddleware.splice(currentInd, 1);
}

watch(
	chatModule,
	(mod) => {
		if (!mod.instance) return;

		resetMiddleware();
		mod.instance.messageSendMiddleware.push(handleDuplicateMessage);
	},
	{ immediate: true },
);

onUnmounted(() => {
	if (!chatModule.value.instance) return;

	resetMiddleware();
});
</script>
