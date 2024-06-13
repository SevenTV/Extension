import { Component, MaybeRefOrGetter, Raw, markRaw, reactive, ref, shallowReactive, shallowRef, watch } from "vue";
import { REACT_ELEMENT_SYMBOL } from "@/common/ReactHooks";
import { getModuleRef } from "@/composable/useModule";
import ReplyTray from "./ReplyTray.vue";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ElementComponentAndProps<P = any> {
	parent: { current: Element | null };
	component: Raw<Component<P>>;
	props: P;
}

export const trayElements = shallowReactive(new Set<ElementComponentAndProps>());

function toReactComponent<P extends object, T extends Component<P>>(
	component: T,
	props?: P,
): ReactExtended.ReactRuntimeElement {
	const track = shallowReactive({ current: null as Element | null });

	const reactElem = { parent: track, component: markRaw<Component<P>>(component), props: props };

	const stop = watch(track, (v) => {
		if (v.current) trayElements.add(reactElem);
		else {
			trayElements.delete(reactElem);
			stop();
		}
	});

	return {
		$$typeof: REACT_ELEMENT_SYMBOL,
		key: null,
		ref: track,
		type: "seventv-tray-container",
		props: {},
	};
}

function isReplyTray(props: Twitch.TrayProps<keyof Twitch.ChatTray.Type>): props is Twitch.TrayProps<"Reply"> {
	const x = props as Twitch.TrayProps<"Reply">;

	return !!(x.id && x.body) && typeof x.deleted === "boolean";
}

function getReplyTray(props: Twitch.TrayProps<"Reply">): Twitch.ChatTray<"Reply", "Reply"> {
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

function getDefaultTray<T extends keyof Twitch.ChatTray.Type>(
	type: T,
	props: Twitch.TrayProps<T>,
): Twitch.ChatTray<T> | null {
	let result: Twitch.ChatTray<keyof Twitch.ChatTray.Type, keyof Twitch.ChatTray.SendMessageHandler.Type> | null =
		null;

	switch (type) {
		case "Reply":
			if (!isReplyTray(props)) break;

			result = getReplyTray(props);
	}

	return result as Twitch.ChatTray<T> | null;
}

export function useTray<T extends keyof Twitch.ChatTray.Type>(
	type: T,
	props?: () => Omit<Twitch.TrayProps<T>, "close">,
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
		} as Twitch.TrayProps<T>;
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
	props: MaybeRefOrGetter<Twitch.ComponentProps<C>>,
	options?: Twitch.CustomTrayOptions,
	isModifier: boolean = false,
) {
	const p = typeof props === "function" ? props : () => props;
	const opts = (options ?? {}) as Twitch.ChatTray<"SevenTVCustomTray">;
	opts.type = "seventv-custom-tray";
	opts.body = markRaw(component);
	return useTray("SevenTVCustomTray", shallowReactive(p), opts, isModifier);
}

export function useTrayRef(options: Twitch.CustomTrayOptions, modifier: boolean = false) {
	type TrayRef = Element | null;
	const headerRef = shallowRef<TrayRef>(null);
	const bodyRef = shallowRef<TrayRef>(null);

	const header: ReactExtended.ReactRuntimeElement = {
		$$typeof: REACT_ELEMENT_SYMBOL,
		key: "header",
		ref: (e: TrayRef) => (headerRef.value = e),
		type: "seventv-tray-container-header",
		props: {},
	};

	const body: ReactExtended.ReactRuntimeElement = {
		$$typeof: REACT_ELEMENT_SYMBOL,
		key: "body",
		ref: (e: TrayRef) => (bodyRef.value = e),
		type: "seventv-vue-component",
		props: {},
	};

	const trayObject: Twitch.ChatTray = {
		type: "seventv-custom-tray",
		header: header,
		body: body,
		sendMessageHandler: options.messageHandler
			? { type: "custom-message-handler", handleMessage: options.messageHandler }
			: options.sendMessageHandler ?? undefined,
	};

	const trayType = modifier ? "setModifierTray" : "setTray";

	const mod = getModuleRef<"TWITCH", "chat-input">("chat-input");

	function set(t?: Twitch.ChatTray) {
		if (!mod.value?.instance || typeof mod.value.instance[trayType] !== "function") return;
		mod.value.instance[trayType]!(t);
	}
	const open = () => set({ ...options, ...trayObject });
	const close = () => set();

	return reactive({ open, close, bodyRef, headerRef });
}

export function useModifierTray<T extends keyof Twitch.ChatTray.Type>(
	type: T,
	props?: () => Twitch.TrayProps<T>,
	tray?: Twitch.ChatTray<T>,
) {
	return useTray(type, props, tray, true);
}
