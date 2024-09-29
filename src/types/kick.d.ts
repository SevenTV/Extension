declare module Kick {
	namespace Message {
		interface DefaultProps {
			channelSlug: string;
			message: {
				id: string;
				chatroom_id: number;
				content: string;
				created_at: string;
				sender: {
					id: number;
					username: string;
					slug: string;
					type: string;
				};
			};
			sender: {
				id: number;
				slug: string;
				username: string;
			};
			messageId: string;
		}
	}

	namespace Lexical {
		type RootListener = (rootElement: null | HTMLElement, prevRootElement: null | HTMLElement) => void;
		type TextContentListener = (text: string) => void;

		type EditorReadOptions = {
			pending?: boolean;
		};

		type EditorUpdateOptions = {
			onUpdate?: () => void;
			tag?: string | Array<string>;
			skipTransforms?: true;
			discrete?: true;
		};

		type EditorFocusOptions = {
			defaultSelection?: "rootStart" | "rootEnd";
		};

		type EditorSetOptions = {
			tag?: string;
		};

		interface EditorState {
			_nodeMap: NodeMap;
			_selection: null | BaseSelection;
		}

		type EditorStateReadOptions = {
			editor?: LexicalEditor | null;
		};

		type CommandListener<P> = (payload: P, editor: LexicalEditor) => boolean;

		class LexicalEditor {
			_commands: Map<LexicalCommand<unknown>, Array<Set<CommandListener<unknown>>>>;
			_nodes: RegisteredNodes;
			registerRootListener(listener: RootListener): () => void;
			registerTextContentListener(listener: TextContentListener): () => void;
			registerCommand<P>(
				command: LexicalCommand<P>,
				listener: CommandListener<P>,
				priority: CommandListenerPriority,
			): () => void;
			registerNodeTransform<T extends LexicalNode>(klass: Class<T>, listener: Transform<T>): () => void;
			hasNodes(nodes: Array<Class<LexicalNode>>): boolean;
			getEditorState(): EditorState;
			setEditorState(editorState: EditorState, options?: EditorSetOptions): void;
			update(updateFn: () => void, options?: EditorUpdateOptions): boolean;
			focus(callbackFn?: () => void, options?: EditorFocusOptions): void;
			blur(): void;
		}

		type NodeKey = string;

		class LexicalNode {
			__type: string;
			constructor(key?: NodeKey): void;
			getChildren<T extends LexicalNode>(): Array<T>;
			getChildren<T extends Array<LexicalNode>>(): T;
			getTextContent(includeDirectionless?: boolean): string;
			getTextContentSize(includeDirectionless?: boolean): number;
			select(_anchorOffset?: number, _focusOffset?: number): RangeSelection;
			remove(preserveEmptyParent?: boolean): void;
			replace<N extends LexicalNode>(replaceWith: N): N;
			insertAfter(nodeToInsert: LexicalNode, restoreSelection?: boolean): LexicalNode;
			insertBefore(nodeToInsert: LexicalNode, restoreSelection?: boolean): LexicalNode;
			append(...nodesToAppend: Array<LexicalNode>): this;
		}

		type NodeMap = Map<NodeKey, LexicalNode>;

		interface BaseSelection {
			getNodes(): Array<LexicalNode>;
			getTextContent(): string;
			insertText(text: string): void;
			insertNodes(nodes: Array<LexicalNode>): void;
		}

		class NodeSelection {
			_nodes: Set<NodeKey>;
			constructor(objects: Set<NodeKey>): void;
			add(key: NodeKey): void;
			delete(key: NodeKey): void;
			clear(): void;
			insertRawText(): void;
			insertText(): void;
			getNodes(): Array<LexicalNode>;
			getTextContent(): string;
			insertNodes(nodes: Array<LexicalNode>): void;
		}

		class RangeSelection {
			anchor: Point;
			focus: Point;
			constructor(anchor: Point, focus: Point, format: number): void;
			getNodes(): Array<LexicalNode>;
			getTextContent(): string;
			insertText(text: string): void;
			insertNodes(nodes: Array<LexicalNode>): void;
			insertNodes(nodes: Array<LexicalNode>): void;
		}

		type TextPointType = {
			offset: number;
			type: "text";
			getNode: () => TextNode;
		};

		type ElementPointType = {
			offset: number;
			type: "element";
			getNode: () => ElementNode;
		};

		type Point = TextPointType | ElementPointType;

		class TextNode extends LexicalNode {
			constructor(text: string, key?: NodeKey): void;
			getTextContent(): string;
			select(_anchorOffset?: number, _focusOffset?: number): RangeSelection;
			spliceText(offset: number, delCount: number, newText: string, moveSelection?: boolean): TextNode;
		}

		class RootNode extends ElementNode {
			constructor(): void;
			getChildren<T extends LexicalNode>(): Array<T>;
			getChildren<T extends Array<LexicalNode>>(): T;
			getTextContent(): string;
			select(_anchorOffset?: number, _focusOffset?: number): RangeSelection;
			remove(): void;
			replace<N extends LexicalNode>(node: N): N;
			insertBefore<T extends LexicalNode>(nodeToInsert: T): T;
			insertAfter<T extends LexicalNode>(nodeToInsert: T): T;
			append(...nodesToAppend: Array<LexicalNode>): this;
		}

		export declare class ElementNode extends LexicalNode {
			constructor(key?: NodeKey): void;
			getChildren<T extends LexicalNode>(): Array<T>;
			getChildren<T extends Array<LexicalNode>>(): T;
			getAllTextNodes(): Array<TextNode>;
			getFirstChild<T extends LexicalNode>(): null | T;
			getLastChild<T extends LexicalNode>(): null | T;
			getTextContent(): string;
			select(_anchorOffset?: number, _focusOffset?: number): RangeSelection;
			selectStart(): RangeSelection;
			selectEnd(): RangeSelection;
			clear(): this;
			append(...nodesToAppend: Array<LexicalNode>): this;
		}

		class ParagraphNode extends ElementNode {
			constructor(key?: NodeKey): void;
		}
	}

	export interface KickEmote {
		id: number;
		channel_id: number | null;
		name: string;
		sbuscribers_only: boolean;
	}

	export interface KickBaseEmoteSet {
		id: string;
		emotes: KickEmote[];
	}

	export interface KickGlobalEmoteSet extends KickBaseEmoteSet {
		name: string;
	}

	export interface KickUserEmoteSet extends KickBaseEmoteSet {
		user_id: number;
		slug: string;
		user: KickIdentity & {
			profile_pic: string;
		};
	}

	export type KickEmoteSet = KickGlobalEmoteSet | KickUserEmoteSet;
}
