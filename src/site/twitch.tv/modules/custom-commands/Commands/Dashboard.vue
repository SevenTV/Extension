<template />
<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import { until } from "@vueuse/core";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatEmotes } from "@/composable/chat/useChatEmotes";
import { useActor } from "@/composable/useActor";
import { useModifierTray } from "@/site/twitch.tv/modules/chat/components/tray/ChatTray";
import { changeEmoteInSetMutation } from "@/assets/gql/seventv.user.gql";
import EnableTray from "./EnableTray.vue";
import { useMutation } from "@vue/apollo-composable";

const emoteNameRegex = new RegExp("^[-_A-Za-z():0-9]{2,100}$");

const props = defineProps<{
	add: (c: Twitch.ChatCommand) => void;
	remove: (c: Twitch.ChatCommand) => void;
}>();

const ctx = useChannelContext();
const emotes = useChatEmotes(ctx);
const actor = useActor();

const activeSet = computed(
	() => ctx.user?.connections?.find((c) => c.platform == ctx.platform)?.emote_set ?? undefined,
);

const mutateEmoteInSet = useMutation(changeEmoteInSetMutation, { errorPolicy: "all" });

await until(() => ctx.id).toBeTruthy();

const hasPermission = computed(() => {
	if (!actor.user) return false;
	if (ctx.id == actor.platformUserID) return true;
	return (ctx.user?.editors ?? []).some((e) => e.id == actor.user?.id);
});

async function doMutation(variables: object) {
	const result = await mutateEmoteInSet.mutate(variables);

	if (result?.errors?.length) {
		return {
			notice: "Unable to do request: " + result.errors[0].extensions.message,
			error: "unauthorized",
		};
	}

	return { notice: "" };
}

async function handleEnable(args: string) {
	const [name] = args.split(" ").filter((n) => n);
	const refName = ref(name);

	let tray = {
		open: () => {
			return;
		},
		clear: () => {
			return;
		},
	};

	return await new Promise<{ notice: string; error?: string }>((resolve) => {
		const onClick = (e: MouseEvent, id: string) => {
			e.stopPropagation();

			if (e.ctrlKey) {
				window.open("https://7tv.app/emotes/" + id, "_blank");
				return;
			}

			doMutation({
				action: "ADD",
				emote_id: id,
				id: activeSet.value?.id,
			}).then((res) => {
				tray.clear();
				resolve(res);
			});
		};

		tray = useModifierTray(
			"CommandInfo",
			() => ({
				close: tray.clear,
				resolve: resolve,
				search: refName,
				onEmoteClick: onClick,
			}),
			{
				type: "command-info",
				body: EnableTray,
				disableCommands: true,
				sendMessageHandler: {
					type: "custom-message-handler",
					handleMessage: (message: string) => {
						refName.value = message;
					},
				},
			},
		);

		tray.open();
	}).catch(() => {
		return {
			notice: "Could not enable emote",
			error: "unauthorized",
		};
	});
}

async function handleDisable(args: string) {
	const [emoteName] = args.split(" ").filter((n) => n);

	const emote = emotes.active[emoteName];
	const inEditableSet = !!emotes.sets[activeSet.value?.id ?? "_"];

	if (!emote) {
		return {
			notice: inEditableSet
				? "The emote is not in a set that you can edit."
				: "Could not find selected 7TV emote.",
			error: "invalid_parameters",
		};
	}

	return doMutation({
		action: "REMOVE",
		emote_id: emote.id,
		id: activeSet.value?.id,
	});
}

async function handleAlias(args: string) {
	const [currentName, newName] = args.split(" ").filter((n) => n);

	const emote = emotes.active[currentName];
	const inEditableSet = !!emotes.sets[activeSet.value?.id ?? "_"];

	if (!emote) {
		return {
			notice: inEditableSet
				? "The emote is not in a set that you can edit."
				: "Could not find selected 7TV emote.",
			error: "invalid_parameters",
		};
	}

	if (!emoteNameRegex.test(newName)) {
		if (newName !== "-") {
			return {
				notice: "Illegal characters in new alias",
				error: "invalid_parameters",
			};
		}
	}

	return doMutation({
		action: "UPDATE",
		emote_id: emote.id,
		id: activeSet.value?.id,
		name: newName === "-" ? "" : newName,
	});
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
			isRequired: true,
		},
	],
	group: "7TV",
};

watch(
	[hasPermission, () => actor.user],
	() => {
		if (hasPermission.value) {
			props.add(commandEnable);
			props.add(commandDisable);
			props.add(commandAlias);
		} else {
			props.remove(commandEnable);
			props.remove(commandDisable);
			props.remove(commandAlias);
		}
	},
	{ immediate: true },
);

onUnmounted(() => {
	props.remove(commandEnable);
	props.remove(commandDisable);
	props.remove(commandAlias);
});
</script>
