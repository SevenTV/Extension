// TransformWorker provides tools to convert and manipulate data without occupying the main thread.

import { log } from "@/common/Logger";
import { TransformWorkerMessage, TransformWorkerMessageType, TypedTransformWorkerMessage } from ".";
import { db } from "@/db/IndexedDB";
import { ConvertTwitchEmoteSet } from "@/common/Transform";

const w = (self as unknown) as DedicatedWorkerGlobalScope;

// Set up logger
log.setContextName("TransformWorker");

w.onmessage = async ev => {
	if (ev.data.source !== "SEVENTV") {
		return; // not a message from us
	}

	switch (ev.data.type as TransformWorkerMessageType) {
		case TransformWorkerMessageType.TWITCH_EMOTES: {
			const msg = ev.data as TransformWorkerMessage<TransformWorkerMessageType.TWITCH_EMOTES>;
			if (!msg.data.input) return;

			const sets = Array(msg.data.input.length);

			for (let i = 0; i < msg.data.input.length; i++) {
				sets[i] = ConvertTwitchEmoteSet(msg.data.input[i]);

				// Update individual sets if they already exist in DB
				db.emoteSets.where({ id: sets[i].id, provider: "TWITCH" }).modify(sets[i]);
			}

			// Store the emote sets in the database
			db.emoteSets.bulkPut(sets);
			break;
		}

		default:
			break;
	}
};

function sendMessage<T extends TransformWorkerMessageType>(
	t: T,
	data: TypedTransformWorkerMessage<T>,
	seq: number,
): void {
	w.postMessage({
		source: "SEVENTV",
		type: t,
		seq,
		data,
	});
}
