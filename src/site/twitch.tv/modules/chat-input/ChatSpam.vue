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
	<!-- Dialog to enable April Fools font -->
	<template v-if="aprilfoolsContainer">
		<Teleport :to="aprilfoolsContainer">
			<UiSuperHint title="April Fools">
				<UiConfirmPrompt
					:choices="['yes', 'no']"
					@answer="handleAprilFoolsAnswer($event)"
					@close="handleAprilFoolsAnswer('')"
				>
					<p>We do a little bit of trolling, Would you like to disable the comic sans font?</p>
				</UiConfirmPrompt>
			</UiSuperHint>
		</Teleport>
	</template>
</template>

<script setup lang="ts">
import { onUnmounted, ref, toRef, watch } from "vue";
import { refAutoReset, useTimeoutFn } from "@vueuse/core";
import { UNICODE_TAG_0, UNICODE_TAG_0_REGEX } from "@/common/Constant";
import type { HookedInstance } from "@/common/ReactHooks";
import { useFloatScreen } from "@/composable/useFloatContext";
import { getModuleRef } from "@/composable/useModule";
import { useConfig } from "@/composable/useSettings";
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

const chatModule = getModuleRef<"TWITCH", "chat">("chat");
const rootEl = toRef(props.instance.domNodes, "root");
const aprilFoolsDisabled = useConfig<boolean>("chat.font-april-fools", false);
const aprilFoolsDismissed = useConfig<boolean>("chat.font-april-fools-dismissed", false);

const suggestContainer = useFloatScreen(rootEl, {
	enabled: () => props.suggest,
	placement: "top-start",
	middleware: [offset({ mainAxis: 72 })],
});

const showAprilsFools = ref(false);
const aprilfoolsContainer = useFloatScreen(rootEl, {
	enabled: () => !aprilFoolsDismissed.value && showAprilsFools.value && !aprilFoolsDisabled.value,
	placement: "top-start",
	middleware: [offset({ mainAxis: 72 })],
});

useTimeoutFn(() => {
	showAprilsFools.value = true;
}, 10000);

const alt = refAutoReset(false, 3e4);

// Handle April Fools answer
function handleAprilFoolsAnswer(answer: string): void {
	if (answer === "yes") {
		aprilFoolsDisabled.value = true;
	}
	aprilFoolsDismissed.value = true;
}
let prevMessage = "";
function handleDuplicateMessage(content: string): string {
	if (typeof content === "string" && content === prevMessage) {
		// Remove existing unicode tags
		// avoids conflict with other extensions
		content = content.replace(UNICODE_TAG_0_REGEX, "");

		// Set alternate unicode tag suffix
		alt.value = !alt.value;
		if (alt.value) {
			content += " " + UNICODE_TAG_0;
		}
	} else {
		alt.value = false;
	}

	prevMessage = content;

	return content;
}

watch(
	chatModule,
	(mod) => {
		if (!mod || !mod.instance) return;

		mod.instance.messageSendMiddleware.set("handle-dupe", handleDuplicateMessage);
	},
	{ immediate: true },
);

onUnmounted(() => {
	if (!chatModule.value?.instance) return;

	chatModule.value.instance.messageSendMiddleware.delete("handle-dupe");
});
</script>

<style setup lang="scss">
.seventv-spam-restriction-bypass {
	padding: 0.5rem;
	text-align: center;
}
</style>
