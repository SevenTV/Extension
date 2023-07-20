<template>
	<div class="seventv-emote-menu-wrap">
		<EmoteMenu
			v-if="anchorEl"
			:anchor-el="anchorEl"
			width="32.5rem"
			scale="1rem"
			:instance="props.instance"
			@emote-click="onEmoteClick($event)"
			@toggle-native-menu="toggle(true)"
			@close="onClose"
		/>
	</div>

	<!-- Replace the emote menu button -->
	<Teleport v-if="buttonEl && placement === 'regular'" :to="buttonEl">
		<EmoteMenuButton @click="toggle()" />
		<div class="seventv-emote-menu-button" :class="{ 'menu-open': ctx.open }" @click.stop="toggle()">
			<Logo provider="7TV" />
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch, watchEffect } from "vue";
import { log } from "@/common/Logger";
import { HookedInstance } from "@/common/ReactHooks";
import { defineFunctionHook, definePropertyHook, unsetPropertyHook } from "@/common/Reflection";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatEmotes } from "@/composable/chat/useChatEmotes";
import { getModuleRef } from "@/composable/useModule";
import { useConfig } from "@/composable/useSettings";
import Logo from "@/assets/svg/logos/Logo.vue";
import EmoteMenuButton from "./EmoteMenuButton.vue";
import EmoteMenu from "@/app/emote-menu/EmoteMenu.vue";
import { useEmoteMenuContext } from "@/app/emote-menu/EmoteMenuContext";
import { useSettingsMenu } from "@/app/settings/Settings";

export type EmoteMenuTabName = SevenTV.Provider | "FAVORITE";

const props = defineProps<{
	instance: HookedInstance<Twitch.ChatInputController>;
	buttonEl?: HTMLButtonElement;
}>();

const anchorEl = ref<HTMLElement | undefined>();
const inputEl = ref<HTMLElement | undefined>();

const ctx = useEmoteMenuContext();
ctx.channelID = props.instance.component.props.channelID ?? "";

const channelCtx = useChannelContext(ctx.channelID, true);
const settingsContext = useSettingsMenu();
const emotes = useChatEmotes(channelCtx);

const searchInputRef = ref<HTMLInputElement | undefined>();

const isSearchInputEnabled = useConfig<boolean>("ui.emote_menu_search");
const usage = useConfig<Map<string, number>>("ui.emote_menu.usage");

const chatModule = getModuleRef("chat");
const placement = useConfig<"regular" | "below" | "hidden">("ui.emote_menu.button_placement");
const inputModule = getModuleRef<"TWITCH", "chat-input-controller">("chat-input-controller");

onMounted(() => {
	if (!inputModule.value?.instance) return;

	inputModule.value.instance.addButton(
		"emote-menu",
		EmoteMenuButton,
		{
			onClick: () => (ctx.open = !ctx.open),
		},
		1,
	);
});

// Toggle the menu's visibility
function toggle(native?: boolean) {
	const t = props.instance.component;
	if (native) {
		t.onEmotePickerButtonClick();
		return;
	}

	if (ctx.open) {
		t.props.closeEmotePicker();
	} else {
		t.props.clearMenus();
		if (typeof t.closeBitsCard === "function") t.closeBitsCard();
		if (typeof t.closePaidPinnedChatCardForEmotePicker === "function") t.closePaidPinnedChatCardForEmotePicker();
		if (typeof t.closeCheerCard === "function") t.closeCheerCard();
	}

	ctx.open = !ctx.open;
	nextTick(() => {
		if (!searchInputRef.value) return;

		searchInputRef.value.focus();
	});
}

function handleEmoteUsage(s: string): string {
	const sp = s.split(" ");
	for (const name of sp) {
		const emote = emotes.active[name];
		if (!emote) continue;

		usage.value.set(emote.id, (usage.value.get(emote.id) ?? 0) + 1);
	}

	usage.value = new Map(usage.value);

	return s;
}

watch(
	chatModule,
	(mod) => {
		if (!mod || !mod.instance) return;

		mod.instance.messageSendMiddleware.set("emote-menu-usage", handleEmoteUsage);
	},
	{ immediate: true },
);

function onEmoteClick(emote: SevenTV.ActiveEmote) {
	const inputRef = props.instance.component.autocompleteInputRef;
	if (!inputRef) return log.warn("ref to input not found, cannot insert emote");

	let current = inputRef.getValue();

	if (isSearchInputEnabled.value) {
		current = current.slice(0, ctx.filter.length ? ctx.filter.length * -1 : Infinity);
	} else {
		current = current.at(-1) === " " ? current : current + " ";
	}

	inputRef.setValue(current + (emote.unicode ?? emote.name) + " ");
	props.instance.component.chatInputRef.focus();
}

defineFunctionHook(props.instance.component, "onBitsIconClick", function (old) {
	old?.();
	ctx.open = false;
});

// This captures the current input typed by the user
definePropertyHook(props.instance.component.autocompleteInputRef, "state", {
	value(v: typeof props.instance.component.autocompleteInputRef.state) {
		if (!ctx.open) {
			ctx.filter = "";

			return;
		}

		if (!isSearchInputEnabled.value) return;

		ctx.filter = v.value.split(" ").at(-1) ?? "";
	},
});

// Handle click-outside
// This closes the menu
function onClose(e: MouseEvent) {
	if (settingsContext.open || !(e.target instanceof Node)) return;

	// If the click was inside the input or on the button, ignore it
	if (inputEl.value && inputEl.value.contains(e.target)) {
		return;
	} else if (props.buttonEl && props.buttonEl.contains(e.target)) {
		return;
	}

	ctx.open = false;
}

// Capture anchor / input elements
watchEffect(() => {
	if (!anchorEl.value && props.instance.domNodes.root) {
		const n = props.instance.domNodes.root.querySelector(".chat-input");
		if (!n) return;

		const input = n.querySelector("[data-test-selector='chat-input']") ?? n;

		anchorEl.value = n as HTMLElement;
		inputEl.value = input as HTMLElement;
	}
});

onUnmounted(() => {
	unsetPropertyHook(props.instance.component.autocompleteInputRef, "state");
	unsetPropertyHook(props.instance.component, "onBitsIconClick");
});
</script>

<style scoped lang="scss">
.seventv-emote-menu-button {
	display: grid;
	place-items: center;
	width: 100%;
	height: 100%;
	font-size: 2rem;
	transition: color 150ms ease-in-out;

	&.menu-open {
		color: var(--seventv-primary);
	}
}
</style>
