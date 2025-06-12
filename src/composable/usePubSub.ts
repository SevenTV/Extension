import { useEventListener } from "@vueuse/core";
import { log } from "@/common/Logger";

declare let window: Window & {
	__twitch_pubsub_events: EventSource;
};

export function usePubSub<D extends EventData, E extends EventDetails<D>>(
	event: E["type"],
	listener: (ev: D) => unknown,
) {
	useEventListener(window.__twitch_pubsub_events, "notification", async (_event: NotificationEvent) => {
		let detail: E;
		try {
			detail = JSON.parse(_event.detail);
		} catch (e) {
			log.error("Failed to parse pubsub message", (e as Error).message);
			return;
		}
		if (detail.type === event) {
			listener(detail.data as D);
		}
	});
}

export interface NotificationEvent {
	type: "notification";
	detail: string;
}

export type EventData =
	| EventDetail.LowTrustUserNewMessage
	| EventDetail.LowTrustUserTreatmentUpdate
	| EventDetail.ModAction
	| EventDetail.ChatRichEmbed
	| EventDetail.ChatHighlight;

export interface EventDetails<T extends EventData = EventData> {
	type: T["_type"];
	data: Omit<T, "_type">;
}

export namespace EventDetail {
	export interface LowTrustUserNewMessage {
		_type: "low_trust_user_new_message";
		low_trust_user: {
			id: string;
			low_trust_id: string;
			channel_id: string;
			sender?: {
				login: string;
				display_name: string;
				chat_color: string;
			};
			updated_at: string;
			treatment: "ACTIVE_MONITORING" | "RESTRICTED" | "NONE";
			evaluated_at: string;
			ban_evasion_evaluation: "LIKELY" | "UNLIKELY" | "POSSIBLE";
			updated_by: {
				id: string;
				login: string;
				display_name: string;
			};
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

	export interface LowTrustUserTreatmentUpdate {
		_type: "low_trust_user_treatment_update";
		low_trust_id: string;
		channel_id: string;
		updated_by: {
			id: string;
			login: string;
			display_name: string;
		};
		updated_at: string;
		target_user_id: string;
		target_user: string;
		treatment: "ACTIVE_MONITORING" | "RESTRICTED" | "NO_TREATMENT";
		types: string[];
		ban_evasion_evaluation: "LIKELY" | "UNLIKELY" | "POSSIBLE";
		evaluated_at: string;
	}

	export interface ModAction {
		_type: "moderation_action";
		type: "chat_login_moderation" | "chat_targeted_login_moderation";
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
	}

	// The chat_rich_embed is undocumented in the twitch pubsub docs.
	export interface ChatRichEmbed {
		_type: "chat_rich_embed";
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

	export interface ChatHighlight {
		_type: "chat-highlight";
		msg_id: string;
		highlights: (
			| {
					type: "raider";
					source_channel_id: string;
					seconds_since_event: number;
			  }
			| {
					type: "returning_chatter";
					source_channel_id: string;
			  }
		)[];
	}
}
