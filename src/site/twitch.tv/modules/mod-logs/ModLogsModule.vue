<template>
	<template v-if="open && buttonRef.current">
		<UiDraggable
			:handle="com?.handle"
			:initial-anchor="(buttonRef.current as HTMLDivElement)"
			:initial-middleware="[shift({ padding: { bottom: 96, right: 8 }, crossAxis: true })]"
		>
			<ModLogs ref="com" @close="open = false" />
		</UiDraggable>
	</template>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { until } from "@vueuse/shared";
import { declareModule, getModule } from "@/composable/useModule";
import ModLogs from "./ModLogs.vue";
import ModLogsButton from "./ModLogsButton.vue";
import UiDraggable from "@/ui/UiDraggable.vue";
import { shift } from "@floating-ui/core";

const { dependenciesMet, markAsReady } = declareModule("mod-logs", {
	name: "Mod Logs",
	depends_on: ["chat-input-controller"],
	config: [
		{
			key: "chat.mod_logs.enabled",
			path: ["Chat", "Moderation"],
			label: "Enable Mod Logs",
			hint: "Mod Logs allow you to view recent and active timeouts/bans in the current channel",
			type: "TOGGLE",
			defaultValue: true,
		},
		{
			key: "chat.mod_logs.ack_risks",
			label: "",
			type: "NONE",
			defaultValue: false,
		},
	],
});

const open = ref(false);
const com = ref<InstanceType<typeof ModLogs> | undefined>();

await until(dependenciesMet).toBe(true);

const controller = getModule("chat-input-controller");
if (!controller?.instance) throw new Error("ChatInputController not found");

// insert button
const buttonRef = controller.instance.addButton(
	ModLogsButton,
	{
		onClick: () => {
			open.value = !open.value;
		},
	},
	2,
);

markAsReady();
</script>
