<template></template>
<script setup lang="ts">
import { onUnmounted, ref, watch } from "vue";
import { Logger } from "@/common/Logger";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatEmotes } from "@/composable/chat/useChatEmotes";
import { useActor } from "@/composable/useActor";
import { getModule } from "@/composable/useModule";
import { useTray } from "@/site/twitch.tv/modules/chat/components/tray/ChatTray";
import EnableTray from "./EnableTray.vue";

const emoteNameRegex = new RegExp("^[-_A-Za-z():0-9]{2,100}$");

const querys = {
	changeEmoteInSet: `
		mutation ChangeEmoteInSet($id: ObjectID!, $action: ListItemAction!, $emote_id: ObjectID!, $name: String) {
			emoteSet(id: $id) {
				id
				emotes(id: $emote_id, action: $action, name: $name) {
					id
					name
				}
			}
		}
	`,
	search: `
		query SearchEmotes($query: String!, $page: Int, $sort: Sort, $limit: Int, $filter: EmoteSearchFilter) {
			emotes(query: $query, page: $page, sort: $sort, limit: $limit, filter: $filter) {
				count
				items {
					id
					name
					state
					trending
					owner {
						id
						username
						display_name
						style {
							color
							paint_id
						}
					}
					flags
					host {
						url
						files {
							name
							format
							width
							height
						}
					}
				}
			}
		}
	`,
};

const props = defineProps<{
	add: (c: Twitch.ChatCommand) => void;
	remove: (c: Twitch.ChatCommand) => void;
}>();

const c = getModule<"TWITCH", "chat">("chat");
if (!c?.instance) throw new Error("ChatController not found");
const info = c.instance.chatController.instances[0].component.props;
const ctx = useChannelContext(info.channelID, true);
const emotes = useChatEmotes(ctx);

let activeSetID: string;

const actor = useActor();
let isEditor = false;

async function hasPermission() {
	return info.channelID == info.userID || isEditor;
}

async function setCurrentChannelId() {
	await fetch("https://api.7tv.app/v3/users/twitch/" + info.channelID)
		.then((response) => {
			if (!response.ok) throw new Error();
			return response.json();
		})
		.then((json) => {
			activeSetID = json.emote_set.id;
			if (!json.id || !json.user?.editors?.length) return;
			isEditor = (json.user.editors as { id: string }[]).some((e) => e.id == actor.user?.id);
		})
		.catch((err) => {
			throw new Error(err);
		});

	return;
}

async function handleRequest(query: string, variables: object, e?: string) {
	const res = await sendRequest(query, variables, e);

	if (res.ok) {
		const json = await res.json();
		if (json.errors && json.errors[0]) {
			return {
				notice: "Unable to do request: " + json.errors[0].extensions.message,
				error: "unauthorized",
			};
		}
		return { notice: "" };
	}

	return {
		notice: "Unable to do request. Error code: " + res.status,
		error: "unauthorized",
	};
}

async function sendRequest(query: string, variables: object, e?: string) {
	actor.query;
	return fetch(import.meta.env.VITE_APP_API_GQL, {
		method: "POST",
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			operationName: e,
			query: query,
			variables: variables,
		}),
	});
}

async function queryEmotes(name: string) {
	const res = await sendRequest(querys.search, {
		filter: {
			animated: false,
			aspect_ratio: "",
			case_sensitive: false,
			category: "TOP",
			exact_match: false,
			ignore_tags: false,
			zero_width: false,
		},
		query: name,
		page: 1,
		limit: 32,
		sort: {
			order: "DESCENDING",
			value: "popularity",
		},
	});

	if (!res.ok) return undefined;

	const json = await res.json();

	return json.data.emotes.items;
}

async function handleEnable(args: string) {
	const [name] = args.split(" ").filter((n) => n);

	const emotes = (await queryEmotes(name)) as SevenTV.ActiveEmote[];

	if (!emotes) {
		return {
			notice: "Could not find any emotes named: " + name,
			error: "invalid_parameters",
		};
	}
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

			handleRequest(
				querys.changeEmoteInSet,
				{
					action: "ADD",
					emote_id: id,
					id: activeSetID,
				},
				"ChangeEmoteInSet",
			).then((res) => {
				tray.clear();
				resolve(res);
			});
		};

		tray = useTray(
			"CommandInfo",
			() => ({
				close: tray.clear,
				emotes: emotes,
				onEmoteClick: onClick,
				onClose: tray.clear,
			}),
			{
				type: "command-info",
				body: EnableTray,
				sendButtonOverride: "Search",
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

	const emote = emotes.find((e) => e.name == emoteName);

	if (emote?.provider != "7TV") {
		return {
			notice: "Could not find selected 7TV emote",
			error: "invalid_parameters",
		};
	}

	const variables = {
		action: "REMOVE",
		emote_id: emote.id,
		id: activeSetID,
	};

	return handleRequest(querys.changeEmoteInSet, variables);
}

async function handleAlias(args: string) {
	const [currentName, newName] = args.split(" ").filter((n) => n);

	const emote = emotes.find((e) => e.name == currentName);

	if (emote?.provider != "7TV") {
		return {
			notice: "Could not find selected 7TV emote.",
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

	const variables = {
		action: "UPDATE",
		emote_id: emote.id,
		id: activeSetID,
		name: newName === "-" ? "" : newName,
	};

	return handleRequest(querys.changeEmoteInSet, variables);
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
	ref(info.channelID),
	() => {
		setCurrentChannelId()
			.then(() => {
				return hasPermission();
			})
			.then((permission) => {
				if (permission) {
					props.add(commandEnable);
					props.add(commandDisable);
					props.add(commandAlias);
				}
			})
			.catch(() => {
				Logger.Get().info("Error with determining if you have permission, channel might not have 7tv enabled");
			});
	},
	{ immediate: true },
);

onUnmounted(() => {
	props.remove(commandEnable);
	props.remove(commandDisable);
	props.remove(commandAlias);
});
</script>
