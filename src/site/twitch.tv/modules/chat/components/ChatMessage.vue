<template>
	<span v-if="msg" class="seventv-chat-message">
		<!-- Chat Author -->
		<template v-if="msg.user && msg.user.userDisplayName">
			<ChatUserTag v-if="msg.user" :user="msg.user" @click="emit('open-viewer-card', $event, msg.user)" />
			<span>: </span>
		</template>

		<!-- Message Content -->
		<span class="seventv-chat-message-body">
			<span class="message-token" :token-type="t.type" v-for="t of tokens">
				<template v-if="t.type === 'text'">
					{{ t.value }}
				</template>
				<template v-else-if="t.type === 'emote'">
					<ChatEmote :emote="t.value" format="WEBP" />
				</template>
			</span>
		</span>
	</span>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useTwitchStore } from "@/site/twitch.tv/TwitchStore";
import { ConvertTwitchEmote } from "@/common/Transform";
import ChatUserTag from "@/site/twitch.tv/modules/chat/ChatUserTag.vue";
import ChatEmote from "@/site/twitch.tv/modules/chat/components/ChatEmote.vue";

const emit = defineEmits<{
	(e: "open-viewer-card", ev: MouseEvent, viewer: Twitch.ChatUser): void;
}>();

const props = defineProps<{
	msg: Twitch.ChatMessage;
}>();

const { emoteMap } = storeToRefs(useTwitchStore());
const localEmoteMap = {} as { [key: string]: SevenTV.ActiveEmote };

// Tokenize the message
const tokens = [] as MessageToken[];

if (props.msg && typeof props.msg.messageBody === "string") {
	const split = (props.msg.messageBody ?? "").split(" ");
	const currentText = [] as string[];

	// Local twitch emotes?
	props.msg.messageParts
		.filter(p => p.type === 6)
		.forEach(p => {
			const emote = p.content as Twitch.ChatMessage.EmoteRef;
			if (Object.keys(emote).length) {
				localEmoteMap[emote.alt] = {
					id: emote.emoteID,
					name: emote.alt,
					data: ConvertTwitchEmote({ id: emote.emoteID, token: emote.alt }),
					provider: "TWITCH",
				} as SevenTV.ActiveEmote;
			}
		});

	const tokenOfCurrentText = () => {
		tokens.push({
			type: "text",
			value: currentText.join(" "),
		} as MessageToken<"text">);

		currentText.length = 0;
	};

	let i = 0;
	while (split.length) {
		const s = split.shift()!;

		const emote = localEmoteMap[s] || emoteMap.value[s];
		const start = !split[i - 1];
		const end = !split[i + 1];

		if (emote) {
			tokenOfCurrentText();

			tokens.push({
				type: "emote",
				value: emote,
			} as MessageToken<"emote">);
		} else {
			currentText.push(start ? "" : " ", s, end ? "" : " ");
		}

		i++;
	}
	tokenOfCurrentText();
}

interface MessageToken<T extends MessageTokenType = any> {
	type: T;
	value: MessageTokenValue<T>;
}

type MessageTokenValue<T extends MessageTokenType> = {
	text: string;
	emote: SevenTV.ActiveEmote;
	[key: string]: any;
}[T];

type MessageTokenType = "text" | "emote";
</script>

<style scoped lang="scss">
.seventv-chat-message {
	display: inline-block !important;
	vertical-align: middle;
	margin-left: 1em;
	margin-right: 1em;
}
</style>
