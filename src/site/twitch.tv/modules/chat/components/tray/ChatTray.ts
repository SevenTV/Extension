import { Component, MaybeRefOrGetter, Raw, markRaw, reactive, ref, watch } from "vue";
import { REACT_ELEMENT_SYMBOL } from "@/common/ReactHooks";
import { getModuleRef } from "@/composable/useModule";
import ReplyTray from "./ReplyTray.vue";
import { ComponentProps, CustomTrayOptions, TrayProps } from "./tray";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ElementComponentAndProps<P = any> {
	parent: { current: Element | null };
	component: Raw<Component<P>>;
	props: P;
}

export const trayElements = reactive(new Set<ElementComponentAndProps>());

function toReactComponent<P extends object, T extends Component<P>>(
	component: T,
	props?: P,
): ReactExtended.ReactRuntimeElement {
	const track = reactive({ current: null as Element | null });

	const reactElem = { parent: track, component: markRaw<Component<P>>(component), props: props };

	watch(
		() => track.current,
		(c) => trayElements[c ? "add" : "delete"](reactElem),
	);

	return {
		$$typeof: REACT_ELEMENT_SYMBOL,
		key: null,
		ref: track,
		type: "seventv-tray-container",
		props: {},
	};
}

function isReplyTray(props: TrayProps<keyof Twitch.ChatTray.Type>): props is TrayProps<"Reply"> {
	const x = props as TrayProps<"Reply">;

	return !!(x.id && x.body) && typeof x.deleted === "boolean";
}

function getReplyTray(props: TrayProps<"Reply">): Twitch.ChatTray<"Reply"> {
	return {
		body: ReplyTray,
		inputValueOverride: "",
		sendButtonOverride: "reply",
		disableBits: true,
		disablePaidPinnedChat: true,
		disableChat: props.deleted || props.thread?.deleted,
		sendMessageHandler: {
			type: "reply",
			additionalMetadata: {
				reply: {
					parentMsgId: props.id,
					parentMessageBody: props.body,
					...(props.authorID
						? {
								parentUid: props.authorID,
								parentUserLogin: props.username,
								parentDisplayName: props.displayName,
						  }
						: {}),
					...(props.thread
						? {
								threadParentMsgId: props.thread.id,
								threadParentDeleted: props.thread.deleted,
								threadParentUserLogin: props.thread.login,
						  }
						: {}),
				},
			},
		},
		type: "reply",
	};
}

function getDefaultTray<T extends keyof Twitch.ChatTray.Type>(type: T, props: TrayProps<T>): Twitch.ChatTray<T> | null {
	let result: Twitch.ChatTray<keyof Twitch.ChatTray.Type> | null = null;

	switch (type) {
		case "Reply":
			if (!isReplyTray(props)) break;

			result = getReplyTray(props);
	}

	return result as Twitch.ChatTray<T> | null;
}

export function useTray<T extends keyof Twitch.ChatTray.Type>(
	type: T,
	props?: () => Omit<TrayProps<T>, "close">,
	tray?: Twitch.ChatTray<T>,
	isModifier = false,
) {
	const mod = getModuleRef<"TWITCH", "chat-input">("chat-input");

	const trayType = isModifier ? "setModifierTray" : "setTray";

	function clear(): void {
		if (!mod.value || typeof mod.value.instance?.[trayType] !== "function") return;

		mod.value.instance[trayType]!(null);
	}

	function open() {
		if (!mod.value || typeof mod.value.instance?.[trayType] !== "function") return;

		const stillOpen = ref(true);

		const p = {
			...props?.(),
			close: () => {
				stillOpen.value = false;
				clear();
			},
		} as TrayProps<T>;
		if (!p) {
			stillOpen.value = false;
			return stillOpen;
		}

		const trayObject = tray ?? getDefaultTray(type, p);
		if (!trayObject) {
			stillOpen.value = false;
			return stillOpen;
		}

		mod.value.instance[trayType]!({
			...trayObject,
			header: trayObject.header ? toReactComponent(trayObject.header, p) : undefined,
			body: trayObject.body ? toReactComponent(trayObject.body, p) : undefined,
		});

		return stillOpen;
	}

	return {
		open,
		clear,
		props,
		options: tray,
	};
}

export function useCustomTray<C extends Component>(
	component: C,
	props: MaybeRefOrGetter<ComponentProps<C>>,
	options?: CustomTrayOptions,
	isModifier: boolean = false,
) {
	const p = typeof props === "function" ? props : () => props;
	const opts = (options ?? {}) as Twitch.ChatTray<"SevenTVCustomTray">;
	opts.type = "seventv-custom-tray";
	opts.body = markRaw(component);
	return useTray("SevenTVCustomTray", p, opts, isModifier);
}

export function useModifierTray<T extends keyof Twitch.ChatTray.Type>(
	type: T,
	props?: () => TrayProps<T>,
	tray?: Twitch.ChatTray<T>,
) {
	return useTray(type, props, tray, true);
}
