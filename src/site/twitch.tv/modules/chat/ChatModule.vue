<template>
	<template v-for="(inst, i) of chatController.instances" :key="inst.identifier">
		<ChatController
			v-if="dependenciesMet && isHookableDbc && shouldMount.get(inst)"
			:list="chatList.instances[0] ?? undefined"
			:controller="chatController.instances[i]"
			:room="chatRoom.instances[0] ?? undefined"
			:buffer="chatBuffer.instances[0] ?? undefined"
			:events="chatEvents.instances[0] ?? undefined"
		/>
	</template>
</template>

<script setup lang="ts">
import { markRaw, reactive, ref, watch } from "vue";
import { refDebounced } from "@vueuse/shared";
import { HookedInstance, getTrackedNode, useComponentHook } from "@/common/ReactHooks";
import { declareModule } from "@/composable/useModule";
import ChatController from "./ChatController.vue";

const { dependenciesMet, markAsReady } = declareModule("chat", {
	name: "Chat",
	depends_on: [],
});

const shouldMount = reactive(new WeakMap<HookedInstance<Twitch.ChatControllerComponent>, boolean>());

const chatRoom = useComponentHook<Twitch.ChatRoomComponent>({
	parentSelector: ".chat-room__content",
	maxDepth: 100,
	predicate: (n) => n.props?.primaryColorHex !== undefined,
});

const chatList = useComponentHook<Twitch.ChatListComponent>(
	{
		parentSelector: ".chat-room__content",
		maxDepth: 100,
		predicate: (n) => n.scrollRef,
	},
	{
		trackRoot: true,
		hooks: {
			render: function (inst) {
				const nodes = inst.component.props.children.map((vnode) =>
					vnode.key ? getTrackedNode(inst, vnode.key as string, vnode) : null,
				);

				return nodes;
			},
		},
	},
);

const chatController = useComponentHook<Twitch.ChatControllerComponent>(
	{
		parentSelector: ".chat-shell, .stream-chat",
		maxDepth: 250,
		predicate: (n) => n.pushMessage && n.props?.messageHandlerAPI,
	},
	{
		hooks: {
			update(inst) {
				shouldMount.set(inst, !!inst.component.props.channelID);
			},
		},
	},
);

const chatBuffer = useComponentHook<Twitch.MessageBufferComponent>({
	parentSelector: ".stream-chat",
	maxDepth: 250,
	predicate: (n) => n.prependHistoricalMessages && n.buffer && n.blockedUsers,
});

const chatEvents = useComponentHook<Twitch.ChatEventComponent>({
	parentSelector: ".stream-chat",
	maxDepth: 250,
	predicate: (n) => n.onClearChatEvent,
});

const isHookable = ref(false);
const isHookableDbc = refDebounced(isHookable, 200);

watch(
	() => [chatController.instances, chatController.instances],
	([a, b]) => (isHookable.value = a.length === b.length),
	{
		immediate: true,
	},
);

markAsReady();

defineExpose({
	chatController,
	chatList,
	chatRoom,
	messageSendMiddleware: new Map<string, (v: string) => string>(),
});
</script>

<script lang="ts">
import { HighlightDef } from "@/composable/chat/useChatHighlights";
import { declareConfig, useConfig } from "@/composable/useSettings";
import SettingsConfigHighlights from "@/site/global/settings/SettingsConfigHighlights.vue";

export const config = [
	declareConfig("general.blur_unlisted_emotes", "TOGGLE", {
		path: ["General", ""],
		label: "Hide Unlisted Emotes",
		hint: "If checked, emotes which have not yet been approved for listing on 7tv.app will be blurred",
		defaultValue: false,
	}),
	declareConfig<number>("chat.emote_margin", "SLIDER", {
		path: ["Chat", "Style"],
		label: "Emote Spacing",
		hint: "Choose the margin around emotes in chat. Negative values lets them overlap and keep the chatlines inline. 0 Makes the emotes not overlap at all",
		options: {
			min: -1,
			max: 1,
			step: 0.1,
			unit: "rem",
		},
		defaultValue: -0.5,
		effect(v) {
			document.documentElement.style.setProperty("--seventv-emote-margin", `${v}rem`);
		},
	}),
	declareConfig<number>("chat.emote_scale", "SLIDER", {
		path: ["Chat", "Style"],
		label: "Emote Scale",
		ffz_key: "chat.emotes.2x",
		ffz_transform(v: unknown) {
			return typeof v === "number" && v > 0 ? 2 : 1;
		},
		hint: "Change how large emotes should be in chat, as a multiple of their original size.",
		options: {
			min: 0.25,
			max: 3,
			step: 0.25,
			unit: "x",
		},
		defaultValue: 1,
	}),
	declareConfig("chat.mod_slider", "TOGGLE", {
		path: ["Chat", "Moderation"],
		label: "Mod Slider",
		hint: "Enable the mod slider in channels where you are moderator",
		defaultValue: true,
	}),
	declareConfig("chat.ignore_clear_chat", "TOGGLE", {
		path: ["Chat", "Moderation"],
		label: "Ignore Clear Chat",
		hint: "If enabled, messages will be kept intact when a moderator clears the chat",
		defaultValue: true,
	}),
	declareConfig("chat.slash_me_style", "DROPDOWN", {
		path: ["Chat", "Style"],
		label: "/me Style",
		hint: "How the /me type messages should be displayed",
		options: [
			["Nothing", 0],
			["Italic", 1],
			["Colored", 2],
			["Italic + Colored", 3],
		],
		defaultValue: 2,
	}),
	declareConfig("chat.message_batch_duration", "SLIDER", {
		path: ["Chat", "Performance"],
		label: "Message Batching",
		hint: "The time to wait between rendering new messages. Higher values may improve performance and readability, at the cost of chat feeling less responsive",
		options: {
			min: 25,
			max: 1000,
			step: 25,
			unit: "ms",
			named_thresolds: [
				[0, 50, "Instant"],
				[50, 250, "Fast"],
				[250, 500, "Balanced"],
				[500, 999, "Slow"],
				[1000, 1000, "PowerPoint Presentation"],
			],
		},
		defaultValue: 150,
	}),
	declareConfig<number>("chat.smooth_scroll_duration", "SLIDER", {
		path: ["Chat", "Performance"],
		label: "Smooth scroll chat",
		hint: "Smoothly scroll new messages into view. This may impact performance.",
		options: {
			min: 0,
			max: 1500,
			step: 100,
			unit: "ms",
		},
		defaultValue: 0,
	}),
	declareConfig<number>("chat.line_limit", "SLIDER", {
		path: ["Chat", "Performance"],
		label: "Message Buffer Capacity",
		hint: "Define the maximum amount of messages displayed in chat. Higher values may affect performance",
		options: {
			min: 50,
			max: 1000,
			step: 10,
			unit: "lines",
			named_thresolds: [
				[0, 750, ""],
				[751, 1000, "Performance Warning!"],
			],
		},
		defaultValue: 150,
	}),
	declareConfig("ui.compact_tooltips", "TOGGLE", {
		path: ["Appearance", "Style"],
		label: "Compact tooltips",
		hint: "Make the tooltips compact instead of showing the full emote",
		defaultValue: false,
	}),
	declareConfig<boolean>("chat.alternating_background", "TOGGLE", {
		path: ["Chat", "Style"],
		ffz_key: "chat.lines.alternate",
		label: "Alternating Background",
		hint: "Display chat lines with alternating background colors",
		defaultValue: false,
	}),
	declareConfig<number>("chat.padding", "DROPDOWN", {
		path: ["Chat", "Style"],
		label: "Padding Style",
		ffz_key: "chat.lines.padding",
		ffz_transform(v: unknown) {
			return v ? 1 : 0;
		},
		effect(v) {
			document.body.style.setProperty(
				"--seventv-chat-padding",
				{
					0: "0",
					1: "0.5rem",
				}[v] ?? null,
			);
		},
		hint: "Change the padding style of chat lines",
		options: [
			["Full-Width", 0],
			["Native (Twitch-like)", 1],
		],
		defaultValue: 1,
	}),
	declareConfig<number>("chat.font_size", "SLIDER", {
		path: ["Chat", "Style"],
		label: "Font Size",
		ffz_key: "chat.font-size",
		ffz_transform(v: unknown) {
			return typeof v === "number" ? v / 16 : 1;
		},
		effect(v) {
			if (typeof v !== "number") return;
			document.body.style.setProperty("--seventv-chat-font-size", `${v}rem`);
		},
		hint: "Change the size of text in chat",
		options: {
			min: 0.1,
			max: 2,
			step: 0.05,
			unit: "rem",
		},
		defaultValue: 1.25,
	}),
	declareConfig<boolean>("chat.colored_mentions", "TOGGLE", {
		path: ["Chat", "Style"],
		label: "Colored Mentions",
		hint: "Show the color of users mentioned in chat",
		defaultValue: true,
	}),
	declareConfig<boolean>("highlights.basic.mention", "TOGGLE", {
		path: ["Highlights", "Built-In"],
		label: "Show Mention Highlights",
		hint: "Whether or not to highlight messages that mention or reply to you in chat",
		defaultValue: true,
	}),
	declareConfig<boolean>("highlights.basic.mention_sound", "TOGGLE", {
		path: ["Highlights", "Built-In"],
		label: "Play Sound on Mention",
		hint: "Play a sound when you are mentioned in chat",
		disabledIf: () => !useConfig("highlights.basic.mention").value,
		defaultValue: false,
	}),
	declareConfig<boolean>("highlights.basic.mention_title_flash", "TOGGLE", {
		path: ["Highlights", "Built-In"],
		label: "Flash Title on Mention",
		hint: "When tabbed out, the username of users who mention you will flash in the title",
		disabledIf: () => !useConfig("highlights.basic.mention").value,
		defaultValue: true,
	}),
	declareConfig<boolean>("highlights.basic.first_time_chatter", "TOGGLE", {
		path: ["Highlights", "Built-In"],
		label: "Show First-Time Chatter Highlights",
		hint: "Whether or not to highlight users who are chatting for the first time",
		defaultValue: true,
	}),
	declareConfig<Map<string, HighlightDef>>("highlights.custom", "CUSTOM", {
		path: ["Highlights", ""],
		custom: {
			component: markRaw(SettingsConfigHighlights),
			gridMode: "new-row",
		},
		label: "Custom Highlights",
		hint: "Create custom highlights for specific words or phrases",
		defaultValue: new Map(),
	}),
	declareConfig<number>("highlights.sound_volume", "SLIDER", {
		path: ["Highlights", "Built-In"],
		label: "Highlight Sound Volume",
		hint: "Control the volume at which sound plays upon being mentioned",
		options: {
			min: 0,
			max: 100,
			step: 1,
			unit: "%",
		},
		defaultValue: 75,
	}),
	declareConfig<number>("highlights.display_style", "DROPDOWN", {
		path: ["Highlights", "Style"],
		label: "Highlighted Message Style",
		hint: "Choose how or if, to show highlighted messages in chat",
		options: [
			["Standard", 0],
			["Minimal (Solid color)", 1],
			["None (No visual)", 2],
		],
		defaultValue: 0,
	}),
	declareConfig<number>("highlights.opacity", "SLIDER", {
		path: ["Highlights", "Style"],
		label: "Highlight Opacity",
		hint: "Change how bright highlights apear in chat",
		options: {
			min: 0,
			max: 100,
			step: 1,
		},
		defaultValue: 10,
	}),
	declareConfig<boolean>("vanity.nametag_paints", "TOGGLE", {
		path: ["Appearance", "Vanity"],
		label: "Nametag Paints",
		hint: "Whether or not to display nametag paints",
		defaultValue: true,
	}),
];
</script>
