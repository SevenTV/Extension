<template />
<script setup lang="ts">
import { onUnmounted } from "vue";
import { useIntervalFn } from "@vueuse/core";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatMessages } from "@/composable/chat/useChatMessages";

const props = defineProps<{
	add: (c: Twitch.ChatCommand) => void;
	remove: (c: Twitch.ChatCommand) => void;
}>();

class RateBucket {
	tokens: number;
	constructor(private capacity: number) {
		this.tokens = capacity;
		setInterval(() => this.addToken(), 30000 / capacity);
	}

	addToken() {
		if (this.tokens < this.capacity) {
			this.tokens += 1;
		}
	}

	take() {
		if (this.tokens > 0) {
			this.tokens -= 1;
			return true;
		}
		return false;
	}
}

const messageLog = new Set<Twitch.ChatMessage>();
const bucket = new RateBucket(100);
const executed = new Set<string>();

const ctx = useChannelContext();
const messages = useChatMessages(ctx);

const handler: Twitch.ChatCommand.Handler = (args: string) => {
	let parsed: NukeArgs;
	try {
		const matches = args.match(re.nukeArgs)?.groups;

		if (!matches) throw new Error();
		if (!matches.pattern) throw errors.nuke.pattern;

		const convert = (s: string) => {
			return (
				{ d: 60 * 60 * 24, h: 60 * 60, m: 60, s: 1 }[s.slice(-1) as "d" | "h" | "m" | "s"] *
				parseInt(s.slice(0, -1))
			);
		};
		const asRegex = matches.pattern.match(re.isRegex);

		parsed = {
			pattern: asRegex ? new RegExp(asRegex[1], asRegex[2]) : new RegExp(matches.pattern),
			action: matches.action ? matches.action : "30",
			before: matches.before ? convert(matches.before) : 30,
			after: matches.after ? convert(matches.after) : 120,
			reason: matches.reason ? matches.reason : "Nuked!",
		};
	} catch (err) {
		return {
			deferred: Promise.resolve({
				notice: command.helpText,
				error: "Invalid arguments",
			}),
		};
	}

	return {
		deferred: execute(parsed).then((message: string) => {
			return {
				notice: message,
			};
		}),
	};
};

const command: Twitch.ChatCommand = {
	name: "nuke",
	description: "⚠️ Nuke a pattern in the chat! - /help nuke",
	helpText: `
		Usage: "/nuke <pattern> <action> <timebounds past:(future)> . "/nuke something bad 10m 3m" would give a 10 minute timeout to anything containing the phrase "something bad" going back 3 minutes in the past. "/nuke /i ?hate ?(red)|(blue)|(green)/i ban 5m:5m" would ban everything that matches the regex going back 5 minutes and keep banning for 5 minutes. Actions are: delete, ban or duration in d, m, h or s. For regex see regex101.com. Using this wrong can cause huge accidents but can also be a very powerfull tool.
		`,
	permissionLevel: 2,
	handler: handler,
	commandArgs: [
		{
			name: "pattern",
			isRequired: true,
		},
		{
			name: "action",
			isRequired: false,
		},
		{
			name: "past:future",
			isRequired: false,
		},
	],
	group: "7TV",
};

const undoCommand: Twitch.ChatCommand = {
	name: "undo",
	description: "Undo the last nuke",
	helpText:
		"Usage: \"/undo undo's the last nuke. If the last nuke was close to 100 to twitch's rate limit might be a hinderance, and you should wait 30 seconds.",
	permissionLevel: 2,
	handler: () => {
		const amount = executed.size;
		executed.forEach((userLogin) => messages.sendMessage(`.unban ${userLogin}`));
		executed.clear();

		return {
			deferred: Promise.resolve({
				notice: `Removed timeout/ban on ${amount} users.`,
			}),
		};
	},
	group: "7TV",
};

async function execute(args: NukeArgs): Promise<string> {
	const start = Date.now() - args.before * 1000;
	executed.clear();

	const msgBuilder = (msg: Twitch.AnyMessage) => {
		switch (args.action) {
			case "ban":
				return `.ban ${msg.user!.userLogin} ${args.reason}`;
			case "delete":
				return `.delete ${msg.id}`;
			default:
				return `.timeout ${msg.user!.userLogin} ${args.action} ${args.reason}`;
		}
	};

	let amount = 0;

	const check = (msg: Twitch.ChatMessage) => {
		if (msg.type !== 0 || msg.user?.userID == ctx.user?.id || msg.user?.userType == "mod") return;
		if (args.action != "delete" && executed.has(msg.user!.userLogin)) return;

		if (msg && args.pattern.test(msg.messageBody)) {
			if (bucket.take()) {
				messages.sendMessage(msgBuilder(msg));
				executed.add(msg.user!.userLogin);
				amount += 1;
			}
		}
	};

	for (const msg of Array.from(messageLog).reverse()) {
		if (msg.timestamp < start) break;
		check(msg as Twitch.ChatMessage);
	}

	if (args.after) {
		const handler = (msg: Twitch.AnyMessage) => {
			if (msg.user) check(msg as Twitch.ChatMessage);
		};

		messages.handlers.add(handler);

		setTimeout(() => {
			messages.handlers.delete(handler);
		}, args.after * 1000);
	}

	props.remove(undoCommand);

	if (args.action !== "delete") props.add(undoCommand);

	switch (args.action) {
		case "delete":
			return `Deleted ${amount} messages containing ${args.pattern}`;
		case "ban":
			return `Banned ${amount} users matching ${args.pattern} . Undo with /undo`;
		default:
			return `Timed out ${amount} users matching ${args.pattern} for ${args.action} . Undo with /undo`;
	}
}

const messageHandler = (msg: Twitch.AnyMessage) => {
	if (msg.user) messageLog.add(msg as Twitch.ChatMessage);
};

const prune = () => {
	const now = Date.now();
	const toPrune = new Set<Twitch.ChatMessage>();
	for (const msg of messageLog) {
		if (msg.timestamp > now - 1000 * 60 * 10) break;
		toPrune.add(msg);
	}

	for (const msg of toPrune) {
		messageLog.delete(msg);
	}
};

messages.handlers.add(messageHandler);

useIntervalFn(prune, 1000 * 60);

props.add(command);

onUnmounted(() => {
	props.remove(command);
	props.remove(undoCommand);
	messages.handlers.delete(messageHandler);
});

const re = {
	isRegex: new RegExp("/(?<pattern>.+)/(?<params>[gimyused]*)"),
	nukeArgs: new RegExp(
		"^(?<pattern>.+?)( (?<action>(delete|ban|[0-9]+[dhms])))?( (?<before>[0-9]+[dhmsDHMS]))?(:(?<after>([0-9]+[dhms])))?( (?<reason>.+?))?\\s?$",
		"i",
	),
};

interface NukeArgs {
	pattern: RegExp;
	action: string;
	before: number;
	after?: number;
	reason: string;
}

const errors = {
	nuke: {
		pattern:
			"Invalid pattern. Usage <pattern/regex> either text that will be searched for or a regex pattern in the form /pattern/ .",
		timebounds:
			"Invalid timebounds. Usage: <past:future> -> 10m:5m or 10m if no percistence into the future. An integer, followed by d for day, h for hour, m for minute, s for second.",
		action: "Invalid action. Usage: <action> is either ban, delete or timeout in the format 10s or 5m etc.",
	},
};
</script>
