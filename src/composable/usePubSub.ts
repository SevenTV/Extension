import { reactive, ref } from "vue";
import { definePropertyHook } from "@/common/Reflection";

declare const __Twitch__pubsubInstances: {
	production: {
		_client: PubSubClient;
		_clientReady: boolean;
		_clienType: string;
		_env: string;
		_hasDisconnected: boolean;
		_iframeHost: string;
		_numDisconnects: number;
		_queuedRequests: unknown[];
	};
};

const client = ref<PubSubClient | null>(null);
const socket = ref<WebSocket | null>(null);

definePropertyHook(
	window as Window & { __Twitch__pubsubInstances?: typeof __Twitch__pubsubInstances },
	"__Twitch__pubsubInstances",
	{
		value(v) {
			if (!v || !v.production || !v.production._client) return;

			client.value = v.production._client;

			definePropertyHook(client.value, "_primarySocket", {
				value(v) {
					if (!v || !v._socket) return;

					socket.value = v._socket;
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
	_addr: string;
	_connectCalled: boolean;
	_connected: boolean;
	_env: string;
	_firstConnectTime: number;
	_firstListenTime: number;
	_listens: {
		_events: Record<string, [(n: unknown) => void, PubSubClient]>;
	};
	_opts: {
		env: string;
	};
	_primarySocket: {
		_addr: string;
		_connecting: boolean;
		_connectionAttempts: number;
		_id: string;
		_opts: {
			addr: string;
		};
		_pingInterval: number;
		_pongTimeout: number;
		_receivedPong: number;
		_sentPing: boolean;
		_socket: WebSocket;
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
}
