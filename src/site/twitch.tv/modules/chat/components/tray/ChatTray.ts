import { Component, Raw, markRaw, reactive, ref, watch } from "vue";
import { REACT_ELEMENT_SYMBOL } from "@/common/ReactHooks";
import { getModuleRef } from "@/composable/useModule";
import ReplyTray from "./ReplyTray.vue";
import { TrayProps } from "./tray";

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
	const track = ref({ current: null as Element | null });

	const reactElem = { parent: track.value, component: markRaw<Component<P>>(component), props: props };

	const stop = watch(track.value, () => {
		if (!track.value.current) {
			// The node was unmounted so we clear and stop watching
			trayElements.delete(reactElem);
			stop();
		} else trayElements.add(reactElem);
	});

	return {
		$$typeof: REACT_ELEMENT_SYMBOL,
		key: null,
		ref: track.value,
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
		disableChat: props.deleted,
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
	props?: () => TrayProps<T>,
	tray?: Twitch.ChatTray<T>,
) {
	const mod = getModuleRef<"TWITCH", "chat-input">("chat-input");

	function clear(): void {
		if (!mod.value || typeof mod.value.instance?.setTray !== "function") return;

		mod.value.instance.setTray(null);
	}

	function open() {
		if (!mod.value || typeof mod.value.instance?.setTray !== "function") return;

		const p = {
			...props?.(),
			close: clear,
		} as TrayProps<T>;
		if (!p) return;

		const trayObject = tray ?? getDefaultTray(type, p);
		if (!trayObject) return;

		mod.value.instance.setTray({
			...trayObject,
			header: trayObject.header ? toReactComponent(trayObject.header, p) : undefined,
			body: trayObject.body ? toReactComponent(trayObject.body, p) : undefined,
		});
	}

	return {
		open,
		clear,
	};
}
