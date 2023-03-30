<template>
	<template v-for="inst of instances" :key="inst.identifier">
		<QoL :channel-id="inst.component.props.channelID" />
	</template>
</template>

<script setup lang="ts">
import { until } from "@vueuse/shared";
import { declareModule, getModule } from "@/composable/useModule";
import QoL from "./QoL.vue";

const { dependenciesMet } = declareModule("qol", {
	name: "Quality of Life",
	depends_on: ["chat"],
});

await until(dependenciesMet).toBeTruthy();

const chat = getModule("chat");
if (!chat || !chat.instance?.chatController) throw new Error("Chat module not found");

const instances = chat.instance.chatController.instances;
</script>
