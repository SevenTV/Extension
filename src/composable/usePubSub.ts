import { reactive, ref } from "vue";
import { definePropertyHook } from "@/common/Reflection";

declare const __twitch_pubsub_client: PubSubClient;

const client = ref<PubSubClient | null>(null);
const socket = ref<WebSocket | null>(null);

definePropertyHook(
	window as Window & { __twitch_pubsub_client?: typeof __twitch_pubsub_client },
	"__twitch_pubsub_client",
	{
		value(v) {
			if (!v || !v.connection || !v.connection.socket) return;

			client.value = v;

			definePropertyHook(client.value.connection, "socket", {
				value(v) {
					if (!v || !v.socket) return;

					socket.value = v.socket;
				},
			});
		},
	},
);

export function usePubSub() {
	return reactive({
		client,
		socket,
	});
}

export interface PubSubClient {
	env: string;
	reconnecting: boolean;
	connection: {
		env: string;
		_events: Record<string, [(n: unknown) => void, PubSubClient]>;
		iframeHost: string | null;
		currentTopics: Record<string, { auth: string | undefined; topic: string }>;
		socket: {
			env: string;
			address: string;
			closing: boolean;
			connecting: boolean;
			connectionAttempts: number;
			pingInterval: number;
			pongTimeout: number;
			receivedPong: boolean;
			sentPing: boolean;
			socket: WebSocket;
		};
	};
}

export interface PubSubMessage {
	type: "MESSAGE" | "RESPONSE";
	data: {
		topic: string;
		message: string;
	};
}

export interface PubSubMessageData {
	type: string;
	data: unknown;
}

export namespace PubSubMessageData {
	export interface LowTrustUserNewMessage {
		low_trust_user: {
			id: string;
			low_trust_id: string;
			channel_id: string;
			sender: Twitch.ChatUser;
			evaluated_at: string;
			updated_at: string;
			ban_evasion_evaluation: string;
			treatment: string;
			updated_by: Twitch.ChatUser;
			shared_ban_channel_ids: string[];
			types: string[];
		};
		message_content: {
			text: string;
			fragments: Twitch.ChatMessage.Part[];
		};
		message_id: string;
		sent_at: string;
	}

	export interface ModAction {
		args: string[];
		created_at: string;
		created_by: string;
		created_by_user_id: string;
		moderation_action:
			| "ban"
			| "unban"
			| "timeout"
			| "untimeout"
			| "delete"
			| "delete_notification"
			| "add_blocked_term"
			| "delete_blocked_term";
		msg_id?: string;
		target_user_id: string;
		target_user_login: string;
		type: "chat_login_moderation" | "chat_targeted_login_moderation";
	}

	// The chat_rich_embed is undocumented in the twitch pubsub docs.
	export interface ChatRichEmbed {
		title: string;
		author_name: string;
		twitch_metadata: {
			clip_metadata: {
				game: string;
				channel_display_name: string;
				slug: string;
				id: string;
				broadcaster_id: string;
				curator_id: string;
			};
		};
		thumbnail_url: string;
		request_url: string;
		message_id: string;
	}
}
