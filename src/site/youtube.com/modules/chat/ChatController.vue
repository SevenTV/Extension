<template>
	<ChatData />
	<ChatAutocomplete :w="w" />
</template>

<script setup lang="ts">
import { defineFunctionHook } from "@/common/Reflection";
import { AnyToken, ChatMessage, EmoteToken } from "@/common/chat/ChatMessage";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatEmotes } from "@/composable/chat/useChatEmotes";
import ChatAutocomplete from "./ChatAutocomplete.vue";
import ChatData from "./ChatData.vue";

const props = defineProps<{
	w: Window;
	channelId: string;
	chatList: YouTube.LiveChatItemListRenderer;
}>();

const ctx = useChannelContext(props.channelId);
const emotes = useChatEmotes(ctx);

const seenEmojis = {} as Record<string, SevenTV.ActiveEmote>;

defineFunctionHook(
	props.chatList.constructor.prototype,
	"handleAddChatItemAction_",
	function (this, old, item: YouTube.LiveChatItem) {
		if (!item || !item.item || !item.item.liveChatTextMessageRenderer?.message) return old?.apply(this, [item]);
		const msg = new ChatMessage(item.clientId ?? item.clientMessageId ?? "");

		// Deconstruct the message into a simple text body
		for (const tok of item.item.liveChatTextMessageRenderer.message.runs) {
			if (tok.text) msg.body += tok.text;
			else if (tok.emoji) {
				const label = tok.emoji.image.accessibility.accessibilityData.label;

				msg.body += label;
				if (!seenEmojis[label]) {
					// emoji tokens are converted to our format for the tokenizer
					seenEmojis[label] = {
						id: tok.emoji.emojiId,
						name: label,
						data: {
							id: tok.emoji.emojiId,
							name: label,
							owner: null,
							host: {
								url: "",
								files: tok.emoji.image.thumbnails.map((im) => ({
									name: im.url,
									width: im.width,
									height: im.height,
									format: "PNG",
								})),
							},
						},
					};
				}
			}
		}

		// Native tokens are cleared as we will now rebuild the message
		const nativeTokens = item.item.liveChatTextMessageRenderer.message.runs;
		nativeTokens.length = 0;

		// Set up our tokenizer instance
		const tokenizer = msg.getTokenizer();
		const tokens =
			tokenizer?.tokenize({
				emoteMap: { ...emotes.active, ...seenEmojis },
				chatterMap: {},
			}) ?? [];

		// Build the message tokens
		const result: MessageTokenOrText[] = [];
		const text = msg.body;

		let lastOffset = 0;
		for (const tok of tokens) {
			const start = tok.range[0];
			const end = tok.range[1];

			const before = text.substring(lastOffset, start);
			if (before) {
				result.push(before);
			}

			result.push(tok);

			lastOffset = end + 1;
		}

		const after = text.substring(lastOffset);
		if (after) {
			result.push(after);
		}

		// Re-construct the message
		for (const tok of result) {
			if (typeof tok === "string") {
				nativeTokens.push({
					text: tok,
				});

				continue;
			}

			switch (tok.kind) {
				case "EMOTE": {
					const data = tok.content as EmoteToken["content"];
					if (!data.emote || !data.emote.data) break;

					const isApp = !seenEmojis[data.emote.name];
					const host = data.emote.data.host;

					nativeTokens.push({
						emoji: {
							emojiId: isApp ? `seventv:${data.emote.id}` : data.emote.id,
							image: {
								accessibility: {
									accessibilityData: {
										label: data.emote.name,
									},
								},
								thumbnails: host.files
									.filter((f) => f.format === host.files[0].format)
									.slice(0, 2)
									.map((f) => ({
										url: host.url ? `${host.url}/${f.name}` : f.name,
										width: f.width,
										height: f.height,
									})),
							},
							isCustomEmoji: true,
						},
					});
					break;
				}

				default:
					break;
			}
		}

		// pass it back to youtube to be rendered
		return old?.apply(this, [item]);
	},
);

type MessageTokenOrText = AnyToken | string;
</script>

<style lang="scss">
:root {
	// Set unbound size for 7TV emotes
	[data-emoji-id^="seventv:"] {
		width: unset !important;
		height: unset !important;
		max-height: 32px;
	}
}
</style>
