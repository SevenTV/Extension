<template>
	<template v-for="(inst, i) of chatList.instances" :key="inst.identifier">
		<ChatController
			v-if="dependenciesMet && isHookableDbc"
			:list="inst"
			:controller="chatController.instances[i]"
			:room="chatRoom.instances[0] ?? undefined"
		/>
	</template>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { refDebounced } from "@vueuse/shared";
import { getTrackedNode, useComponentHook } from "@/common/ReactHooks";
import { declareModule } from "@/composable/useModule";
import ChatController from "./ChatController.vue";

const { dependenciesMet, markAsReady } = declareModule("chat", {
	name: "Chat",
	depends_on: [],
	config: [
		{
			key: "general.blur_unlisted_emotes",
			label: "Hide Unlisted Emotes",
			hint: "If checked, emotes which have not yet been approved for listing on 7tv.app will be blurred",
			type: "TOGGLE",
			defaultValue: false,
		},
		{
			key: "chat.emote_margin",
			label: "Emote Spacing",
			hint: "Choose the margin around emotes in chat. Negative values lets them overlap and keep the chatlines inline. 0 Makes the emotes not overlap at all",
			type: "SLIDER",
			options: {
				min: -1,
				max: 1,
				step: 0.1,
				unit: "rem",
			},
			defaultValue: -0.5,
		},
		{
			key: "chat.mod_slider",
			label: "Mod Slider",
			hint: "Enable the mod slider in channels where you are moderator",
			type: "TOGGLE",
			defaultValue: true,
		},
		{
			key: "chat.slash_me_style",
			label: "/me Style",
			hint: "How the /me type messages should be displayed",
			type: "DROPDOWN",
			options: [
				["Nothing", 0],
				["Italic", 1],
				["Colored", 2],
				["Italic + Colored", 3],
			],
			defaultValue: 2,
		},
		{
			key: "chat.message_batch_duration",
			label: "Message Batching",
			hint: "The time to wait between rendering new messages. Higher values may improve performance and readability, at the cost of chat feeling less responsive",
			type: "SLIDER",
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
		},
		{
			key: "chat.smooth_scroll_duration",
			label: "Smooth scroll chat",
			hint: "Smoothly scroll new messages into view. This may impact performance.",
			type: "SLIDER",
			options: {
				min: 0,
				max: 1500,
				step: 100,
				unit: "ms",
			},
			defaultValue: 0,
		},
		{
			key: "chat.line_limit",
			label: "Line Limit",
			hint: "The maximum amount of lines that will be displayed in chat. Higher values may affect performance",
			type: "SLIDER",
			options: {
				min: 50,
				max: 500,
				step: 10,
				unit: "lines",
			},
			defaultValue: 150,
		},
		{
			key: "ui.compact_tooltips",
			label: "Compact tooltips",
			hint: "Make the tooltips compact instead of showing the full emote",
			type: "TOGGLE",
			defaultValue: false,
		},
		{
			category: "Chat",
			key: "chat.alternating_background",
			ffz_key: "chat.lines.alternate",
			label: "Alternating Background",
			hint: "Display chat lines with alternating background colors",
			type: "TOGGLE",
			defaultValue: false,
		},
		{
			key: "chat.padding",
			label: "Padding Style",
			ffz_key: "chat.lines.padding",
			ffz_transform(v) {
				return v ? 1 : 0;
			},
			hint: "Change the padding style of chat lines",
			type: "DROPDOWN",
			options: [
				["Full-Width", 0],
				["Native (Twitch-like)", 1],
			],
			defaultValue: 1,
		},
	],
});

const chatRoom = useComponentHook<Twitch.ChatRoomComponent>({
	parentSelector: ".stream-chat",
	predicate: (n) => n.props?.primaryColorHex !== undefined,
});

const chatList = useComponentHook<Twitch.ChatListComponent>(
	{
		parentSelector: ".chat-room",
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

const chatController = useComponentHook<Twitch.ChatControllerComponent>({
	parentSelector: ".chat-shell, .stream-chat",
	predicate: (n) => n.pushMessage && n.props?.messageHandlerAPI,
});

const isHookable = computed(() => chatController.instances.length === chatList.instances.length);
const isHookableDbc = refDebounced(isHookable, 2500);

markAsReady();

defineExpose({
	chatController,
	chatList,
	chatRoom,
});
</script>
