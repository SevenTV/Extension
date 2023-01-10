<template>
	<template v-for="(inst, i) of chatList.instances" :key="inst.identifier">
		<ChatController
			v-if="dependenciesMet && isHookable"
			:list="inst"
			:controller="chatController.instances[i]"
			:room="chatRoom.instances[0] ?? undefined"
		/>
	</template>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { getTrackedNode, useComponentHook } from "@/common/ReactHooks";
import { useModule } from "@/composable/useModule";
import ChatController from "./ChatController.vue";

const { dependenciesMet, markAsReady } = useModule("chat", {
	name: "Chat",
	depends_on: [],
	config: [
		{
			key: "general.blur_unlisted_emotes",
			label: "Unlisted Emotes",
			hint: "If checked, emotes which have not yet been approved for listing on 7tv.app will be blurred",
			type: "TOGGLE",
			options: {
				left: "Show",
				right: "Blur",
			},
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
			defaultValue: -1,
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
			key: "chat.smooth_scroll_duration",
			label: "Smooth scroll chat",
			hint: "How smooth should the chat scroll on new messages. 0 is instant",
			type: "SLIDER",
			options: {
				min: 0,
				max: 3000,
				step: 100,
				unit: "ms",
			},
			defaultValue: 0,
		},
		{
			key: "chat.line_limit",
			label: "Line Limit",
			hint: "The max number of lines that will be displayed in chat. Higher numbers may affect performance",
			type: "SLIDER",
			options: {
				min: 50,
				max: 1000,
				step: 10,
				unit: "lines",
			},
			defaultValue: 150,
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

const isHookable = computed(
	() =>
		chatController.instances.length === chatList.instances.length &&
		chatController.instances.length === chatRoom.instances.length,
);

markAsReady();
</script>
