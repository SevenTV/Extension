import { Component, Raw, markRaw, reactive, ref, watch } from "vue";
import { REACT_ELEMENT_SYMBOL } from "@/common/ReactHooks";
import ReplyTray from "./ReplyTray.vue";
import { getModule } from "../useModule";

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

	const w = watch(track.value, () => {
		if (!track.value.current) {
			// The node was unmounted so we clear and stop watching
			trayElements.delete(reactElem);
			w();
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

function isReplyTray(
	props: Twitch.ChatTray.props<keyof Twitch.ChatTray.Type>,
): props is Twitch.ChatTray.props<"Reply"> {
	return !!(props as Twitch.ChatTray.props<"Reply">).msg;
}

function getReplyTray(props: Twitch.ChatTray.props<"Reply">): Twitch.ChatTray<"Reply"> {
	return {
		body: ReplyTray,
		inputValueOverride: "",
		sendButtonOverride: "reply",
		disableBits: true,
		disablePaidPinnedChat: true,
		disableChat: props.msg.deleted,
		sendMessageHandler: {
			type: "reply",
			additionalMetadata: {
				reply: {
					parentDeleted: props.msg.deleted,
					parentMsgId: props.msg.id,
					parentMessageBody: props.msg.messageBody,
					parentUid: props.msg.user.userID,
					parentUserLogin: props.msg.user.userLogin,
					parentDisplayName: props.msg.user.userDisplayName,
				},
			},
		},
		type: "reply",
	};
}

function getDefaultTray<T extends keyof Twitch.ChatTray.Type>(
	type: T,
	props: Twitch.ChatTray.props<T>,
): Twitch.ChatTray<T> | null {
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
	props?: Twitch.ChatTray.props<T>,
	tray?: Twitch.ChatTray<T>,
) {
	const mod = getModule("chat-input");
	if (!mod?.instance) return { set: () => null, clear: () => null };

	const { setTray } = mod.instance;

	const p = { ...props, close: () => setTray?.() } as Twitch.ChatTray.props<T>;

	function set() {
		const trayObject = tray ?? getDefaultTray(type, p);
		if (!trayObject) return;
		setTray?.({
			...trayObject,
			header: trayObject.header ? toReactComponent(trayObject.header, p) : undefined,
			body: trayObject.body ? toReactComponent(trayObject.body, p) : undefined,
		});
	}

	return { set, clear: p.close };
}
