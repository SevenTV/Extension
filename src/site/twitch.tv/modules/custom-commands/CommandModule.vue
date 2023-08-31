<template>
	<template v-for="i of ch.instances" :key="i">
		<Nuke :add="i.component.addCommand" :remove="i.component.removeCommand" />
		<Dashboard :add="i.component.addCommand" :remove="i.component.removeCommand" />
		<Song :add="i.component.addCommand" :remove="i.component.removeCommand" />
	</template>
</template>
<script setup lang="ts">
import { useComponentHook } from "@/common/ReactHooks";
import { defineFunctionHook } from "@/common/Reflection";
import { declareModule } from "@/composable/useModule";
import Nuke from "./Commands/Nuke.vue";
import Dashboard from "./Commands/Dashboard.vue";
import Song from "./Commands/Song.vue";
import { shallowRef } from "vue";
import { watchArray } from "@vueuse/core";

const { markAsReady } = declareModule("command-manager", {
	name: "Command Manager",
	depends_on: ["chat"],
});

const ch = useComponentHook<Twitch.ChatCommandComponent>({
	predicate: (n) => n.addCommand,
	maxDepth: 300,
});

const grouper = useComponentHook<Twitch.ChatCommandGrouperComponent>({
	predicate: (n) => n.determineGroup,
	maxDepth: 300,
});

function hookGrouper(g: Twitch.ChatCommandGrouperComponent) {
	defineFunctionHook(g, "determineGroup", function (this, old, command: Twitch.ChatCommand) {
		return command.group ? command.group : old?.call(this, command);
	});
}

watchArray(shallowRef(grouper.instances).value, (a) => a.forEach(({ component }) => hookGrouper(component)), {
	immediate: true,
});

markAsReady();
</script>
<script lang="ts">
export const config = [];
</script>
