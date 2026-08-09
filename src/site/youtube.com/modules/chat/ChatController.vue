<template>
	<ChatData />
	<ChatAutocomplete :w="w" />
</template>

<script setup lang="ts">
import { watch, watchEffect } from "vue";
import { defineFunctionHook } from "@/common/Reflection";
import { tokenize } from "@/common/Tokenize.js";
import { AnyToken, ChatMessage, EmoteToken } from "@/common/chat/ChatMessage";
import { useChannelContext } from "@/composable/channel/useChannelContext";
import { useChatEmotes } from "@/composable/chat/useChatEmotes";
import { useChatMessages } from "@/composable/chat/useChatMessages.js";
import { useEmoteBlacklist } from "@/composable/chat/useEmoteBlacklist";
import { useConfig } from "@/composable/useSettings";
import ChatAutocomplete from "./ChatAutocomplete.vue";
import ChatData from "./ChatData.vue";

const props = defineProps<{
	w: Window;
	channelId: string;
	chatList: YouTube.LiveChatItemListRenderer;
}>();

const ctx = useChannelContext(props.channelId, true);
const emotes = useChatEmotes(ctx);

const chatMessages = useChatMessages(ctx);
const { hiddenEmotes } = useEmoteBlacklist();

const filter = useConfig<string[]>("chat.filtered_words");

const seenEmojis = {} as Record<string, SevenTV.ActiveEmote>;

function withoutHidden(
	map: Record<string, SevenTV.ActiveEmote>,
	hidden: Set<string>,
): Record<string, SevenTV.ActiveEmote> {
	if (hidden.size === 0) return map;
	return Object.fromEntries(Object.entries(map).filter(([name]) => !hidden.has(name)));
}

watch(
	hiddenEmotes,
	() => {
		for (const m of chatMessages.displayed) {
			m.tokens = tokenize({
				body: m.body,
				chatterMap: {},
				emoteMap: withoutHidden(emotes.active, hiddenEmotes.value),
				localEmoteMap: withoutHidden({ ...seenEmojis, ...(m.nativeEmotes ?? {}) }, hiddenEmotes.value),
				filteredWords: filter.value,
			});
		}
	},
	{ deep: true },
);

watchEffect(() => {
	ctx.setCurrentChannel({
		id: props.channelId,
		displayName: "",
		username: "",
		active: true,
	});

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
			const tokens = tokenize({
				body: msg.body,
				chatterMap: {},
				emoteMap: withoutHidden(emotes.active, hiddenEmotes.value),
				localEmoteMap: withoutHidden({ ...seenEmojis, ...(msg.nativeEmotes ?? {}) }, hiddenEmotes.value),
				filteredWords: filter.value,
			});

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
});

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
