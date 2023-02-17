import { defineComponent, markRaw } from "vue";
import { Tokenizer } from "@/common/chat/Tokenizer";
import { SetHexAlpha } from "../Color";

export const NullComponent = defineComponent({});

export class ChatMessage<C extends ComponentFactory = ComponentFactory> {
	public readonly sym = Symbol("seventv-message");
	public body = "";
	public author: ChatUser | null = null;
	public channelID = "";
	private component?: C | null = null;
	public componentProps?: InstanceType<C>["$props"] | null = null;
	public highlight: Highlight | null = null;
	public flags = new Set<string>();
	public mentions = new Set<string>();
	public badges = {} as Record<string, string>;
	public nonce = "";
	public deliveryState: MessageDeliveryState = "IDLE";
	public timestamp = 0;
	public historical = false;
	public moderation: ChatMessageModeration = {
		deleted: false,
		banned: false,
		banDuration: null,
		banReason: "",
		actionType: null,
		actor: null,
		timestamp: 0,
	};
	public slashMe = false;
	public parent: ChatMessageParent | null = null;
	public wrappedNode: Element | null = null;
	public nativeEmotes = {} as Record<string, SevenTV.ActiveEmote>;

	public tokens = new Array<AnyToken>();
	private tokenizer?: Tokenizer;

	version = 0;

	update(): void {
		this.version++;
	}

	constructor(public id: string) {
		this.tokenizer = new Tokenizer(this);
	}

	get instance(): InstanceType<C> | null {
		return (this.component as InstanceType<C>) ?? null;
	}

	get instanceProps(): InstanceType<C>["$props"] | null {
		return this.componentProps ?? null;
	}

	public getTokenizer(): Tokenizer | null {
		return this.tokenizer ?? (this.tokenizer = new Tokenizer(this));
	}

	public setAuthor(author: ChatUser): void {
		if (typeof author.username !== "string") author.username = "";
		if (typeof author.displayName !== "string") author.displayName = "";

		this.author = author;
	}

	public setID(id: string): void {
		this.id = id;
	}

	public setHighlight(color: string, label: string): void {
		this.highlight = {
			color,
			dimColor: color.concat(SetHexAlpha(0.1)),
			label,
		};
	}

	public setNonce(nonce: string): void {
		this.nonce = nonce;
	}

	public setDeliveryState(state: MessageDeliveryState): void {
		this.deliveryState = state;
	}

	public setComponent<DEF_C extends ComponentFactory>(
		component: DEF_C,
		props?: Omit<InstanceType<DEF_C>["$props"], "msg">,
	): ChatMessage<DEF_C> {
		this.component = markRaw(component) as unknown as C;
		this.componentProps = props;

		return this as unknown as ChatMessage<DEF_C>;
	}

	public setTimestamp(time: number) {
		this.timestamp = time;
	}
}

export interface ChatUser {
	id: string;
	username: string;
	displayName: string;
	color: string;
	intl?: boolean;
	lastMsgId?: symbol;
	isActor?: boolean;
}

interface Highlight {
	color: string;
	dimColor: string;
	label: string;
}

export interface ChatMessageToken<K, T> {
	kind: K;
	content: T;
	range: [number, number];
}

export type AnyToken = ChatMessageToken<MessageTokenKind, unknown>;
export type TextToken = ChatMessageToken<"TEXT", string>;
export type LinkToken = ChatMessageToken<
	"LINK",
	{
		embedType?: string;
		embedData?: Record<string, string>;
		displayText: string;
		url: string;
	}
>;
export type FlaggedSegmentToken = ChatMessageToken<
	"FLAGGED_SEGMENT",
	{ originalText: string; length: number; categories: { [key: string]: boolean }; content: TextToken }
>;
export type MentionToken = ChatMessageToken<
	"MENTION",
	{
		displayText: string;
		recipient: string;
	}
>;
export type EmoteToken = ChatMessageToken<
	"EMOTE",
	{
		emote: SevenTV.ActiveEmote;
		overlaid: Record<string, SevenTV.ActiveEmote>;
		cheerAmount?: number;
		cheerColor?: string;
	}
>;

export type VoidToken = ChatMessageToken<"VOID", void>;

export type MessageTokenKind = "TEXT" | "LINK" | "FLAGGED_SEGMENT" | "MENTION" | "EMOTE" | "VOID";

export type MessageDeliveryState = "IDLE" | "IN_FLIGHT" | "SENT" | "BOUNCED";

export interface ChatMessageParent {
	id: string;
	deleted: boolean;
	body: string;
	uid: string;
	author: {
		username: string;
		displayName: string;
	} | null;
}

export interface ChatMessageModeration {
	deleted: boolean;
	banned: boolean;
	banDuration: number | null;
	banReason: string;
	actionType: null | "BAN" | "TIMEOUT" | "DELETE";
	actor: ChatUser | null;
	timestamp: number;
}
