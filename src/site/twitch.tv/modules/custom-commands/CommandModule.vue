<template>
	<template v-for="i of ch.instances" :key="i">
		<template v-for="cmd of commands" :key="cmd">
			<component :is="cmd" v-bind="{ add: i.component.addCommand, remove: i.component.removeCommand }" />
		</template>
	</template>
</template>
<script setup lang="ts">
import type { Component } from "vue";
import { until } from "@vueuse/core";
import { useComponentHook } from "@/common/ReactHooks";
import { declareModule } from "@/composable/useModule";
import Dashboard from "./Commands/Dashboard.vue";
import Nuke from "./Commands/Nuke.vue";
import Song from "./Commands/Song.vue";

const { dependenciesMet, markAsReady } = declareModule("command-manager", {
	name: "Command Manager",
	depends_on: ["chat", "chat-input"],
});

await until(dependenciesMet).toBe(true);

const commands = [Dashboard, Song, Nuke] as Component[];

useComponentHook<Twitch.ChatCommandGrouperComponent>(
	{
		parentSelector: ".chat-input__textarea",
		predicate: (n) => n.determineGroup,
		maxDepth: 50,
	},
	{
		functionHooks: {
			determineGroup(
				this,
				old: Twitch.ChatCommandGrouperComponent["determineGroup"],
				command: Twitch.ChatCommand,
			) {
				return command.group ? command.group : old.call(this, command) ?? "Twitch";
			},
		},
	},
);

const ch = useComponentHook<Twitch.ChatCommandComponent>({
	parentSelector: ".chat-shell, .kDpAEF",
	predicate: (n) => n.addCommand,
	maxDepth: 100,
});
</script>
