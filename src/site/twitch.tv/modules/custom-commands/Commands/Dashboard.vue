<template>
	<Tray
		v-if="showTray"
		placeholder="Search again..."
		:input-value-override="search"
		disable-commands
		:message-handler="(m) => (search = m)"
	>
		<EnableTray :search="search" :mut="mut" name="body" @close="showTray = false" />
	</Tray>
</template>
<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from "vue";
import { useSetMutation } from "@/composable/useSetMutation";
import EnableTray from "./components/EnableTray.vue";
import Tray from "../../chat/components/tray/Tray.vue";
import { FetchResult } from "@apollo/client";
import { GraphQLError } from "graphql";

const emoteNameRegex = new RegExp("^[-_A-Za-z():0-9]{2,100}$");

const props = defineProps<{
	add: (c: Twitch.ChatCommand) => void;
	remove: (c: Twitch.ChatCommand) => void;
}>();

const mut = useSetMutation();

const search = ref("");
const showTray = ref(false);

async function handle(p: Promise<FetchResult | undefined>): Promise<Twitch.ChatCommand.AsyncResult> {
	return await p
		.then(() => ({}))
		.catch((e: GraphQLError) => ({
			notice: ("Unable to do request: " + e.message) as string,
			error: "unauthorized",
		}));
}

async function handleEnable(args: string) {
	search.value = args.split(" ").filter((n) => n)[0];

	return nextTick(() => (showTray.value = true)).then(() => ({}));
}

async function handleDisable(args: string) {
	const [emoteName] = args.split(" ").filter((n) => n);

	const emote = mut.set?.emotes.find((e) => e.name === emoteName);

	if (!emote) {
		return {
			notice: emote ? "The emote is not in a set that you can edit." : "Could not find selected 7TV emote.",
			error: "invalid_parameters",
		};
	}

	return handle(mut.remove(emote.id));
}

async function handleAlias(args: string) {
	const [currentName, newName] = args.split(" ").filter((n) => n);

	const emote = mut.set?.emotes.find((e) => e.name === currentName);

	if (!emote) {
		return {
			notice: emote ? "The emote is not in a set that you can edit." : "Could not find selected 7TV emote.",
			error: "invalid_parameters",
		};
	}

	if (newName && !emoteNameRegex.test(newName)) {
		return {
			notice: "Illegal characters in new alias",
			error: "invalid_parameters",
		};
	}
	return handle(mut.rename(emote.id, newName));
}

const commandEnable: Twitch.ChatCommand = {
	name: "enable",
	description: "Enable a 7TV emote",
	helpText: "",
	permissionLevel: 0,
	handler: (args) => {
		return { deferred: handleEnable(args) };
	},
	commandArgs: [
		{
			name: "emote",
			isRequired: true,
		},
	],
	group: "7TV",
};

const commandSearch = {
	...commandEnable,
	name: "search",
	description: "Search for a 7TV emote",
};

const commandDisable: Twitch.ChatCommand = {
	name: "disable",
	description: "Disable a 7TV emote",
	helpText: "",
	permissionLevel: 0,
	handler: (args) => {
		return { deferred: handleDisable(args) };
	},
	commandArgs: [
		{
			name: "emote",
			isRequired: true,
		},
	],
	group: "7TV",
};

const commandAlias: Twitch.ChatCommand = {
	name: "alias",
	description: "Set an alias for a 7TV emote",
	helpText: "",
	permissionLevel: 0,
	handler: (args) => {
		return { deferred: handleAlias(args) };
	},
	commandArgs: [
		{
			name: "current",
			isRequired: true,
		},
		{
			name: "new",
			isRequired: false,
		},
	],
	group: "7TV",
};

watch(
	() => mut.canEditSet,
	(c) => {
		if (c) {
			props.add(commandEnable);
			props.add(commandDisable);
			props.add(commandAlias);

			props.remove(commandSearch);
		} else {
			props.remove(commandDisable);
			props.remove(commandAlias);
			props.remove(commandEnable);

			props.add(commandSearch);
		}
	},
	{ immediate: true },
);

onUnmounted(() => {
	props.remove(commandEnable);
	props.remove(commandDisable);
	props.remove(commandAlias);
	props.remove(commandSearch);
});
</script>
