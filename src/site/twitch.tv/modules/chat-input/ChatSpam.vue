<template>
	<!-- Dialog to enable spam mode -->
	<template v-if="suggest && suggestContainer">
		<Teleport :to="suggestContainer">
			<UiSuperHint title="Suggestion">
				<UiConfirmPrompt
					:choices="['yes', 'no']"
					@answer="emit('suggest-answer', $event)"
					@close="emit('suggest-answer', '')"
				>
					<p>Would you like 7TV to let you bypass this restriction?</p>
				</UiConfirmPrompt>
			</UiSuperHint>
		</Teleport>
	</template>
</template>

<script setup lang="ts">
import { onUnmounted, toRef, watch } from "vue";
import { UNICODE_TAG_0, UNICODE_TAG_0_REGEX } from "@/common/Constant";
import type { HookedInstance } from "@/common/ReactHooks";
import { useFloatScreen } from "@/composable/useFloatContext";
import { getModuleRef } from "@/composable/useModule";
import UiConfirmPrompt from "@/ui/UiConfirmPrompt.vue";
import UiSuperHint from "@/ui/UiSuperHint.vue";
import { offset } from "@floating-ui/core";

const props = defineProps<{
	instance: HookedInstance<Twitch.ChatAutocompleteComponent>;
	suggest?: boolean;
}>();

const emit = defineEmits<{
	(e: "suggest-answer", answer: string): void;
}>();

const chatModule = getModuleRef("chat");
const rootEl = toRef(props.instance.domNodes, "root");
const suggestContainer = useFloatScreen(rootEl, {
	enabled: () => props.suggest,
	placement: "top-start",
	middleware: [offset({ mainAxis: 72 })],
});

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

<style setup lang="scss">
.seventv-spam-restriction-bypass {
	padding: 0.5rem;
	text-align: center;
}
</style>
