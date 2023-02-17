<template>
	<template v-for="(inst, i) of chatController.instances" :key="inst.identifier">
		<ChatController
			v-if="dependenciesMet && isHookableDbc && shouldMount.get(inst)"
			:list="chatList.instances[0] ?? undefined"
			:controller="chatController.instances[i]"
			:room="chatRoom.instances[0] ?? undefined"
			:buffer="chatBuffer.instances[0] ?? undefined"
		/>
	</template>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { refDebounced } from "@vueuse/shared";
import { HookedInstance, getTrackedNode, useComponentHook } from "@/common/ReactHooks";
import { declareModule } from "@/composable/useModule";
import { declareConfig } from "@/composable/useSettings";
import ChatController from "./ChatController.vue";

const { dependenciesMet, markAsReady } = declareModule("chat", {
	name: "Chat",
	depends_on: [],
	config: [
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
		declareConfig("chat.mod_slider", "TOGGLE", {
			path: ["Chat", "Moderation"],
			label: "Mod Slider",
			hint: "Enable the mod slider in channels where you are moderator",
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
			label: "Line Limit",
			hint: "The maximum amount of lines that will be displayed in chat. Higher values may affect performance",
			options: {
				min: 50,
				max: 500,
				step: 10,
				unit: "lines",
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
	],
});

const shouldMount = reactive(new WeakMap<HookedInstance<Twitch.ChatControllerComponent>, boolean>());

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

const chatController = useComponentHook<Twitch.ChatControllerComponent>(
	{
		parentSelector: ".chat-shell, .stream-chat",
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
	predicate: (n) => n.prependHistoricalMessages && n.buffer && n.blockedUsers,
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
	messageSendMiddleware: [] as ((v: string) => string)[],
});
</script>
