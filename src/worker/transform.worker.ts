// TransformWorker provides tools to convert and manipulate data without occupying the main thread.

import { log } from "@/common/Logger";
import { TransformWorkerMessageType } from ".";
import { db } from "@/db/IndexedDB";
import { convertTwitchEmoteSet } from "@/common/Transform";

const w = self as unknown as DedicatedWorkerGlobalScope;

// Set up logger
log.setContextName("TransformWorker");

w.onmessage = async (ev) => {
	// Return if message is not from us
	if (ev.data.source !== "SEVENTV") return;

	// Return if no input data was provided
	if (!ev.data.data.input) return;

	const data = ev.data.data.input;

	switch (ev.data.type as TransformWorkerMessageType) {
		case TransformWorkerMessageType.TWITCH_EMOTES: {
			transformTwitch(data);
			break;
		}

		default:
			break;
	}
};

function transformTwitch(data: Twitch.TwitchEmoteSet[]) {
	const sets = Array(data.length);

	for (let i = 0; i < data.length; i++) {
		sets[i] = convertTwitchEmoteSet(data[i]);

		// Update individual sets if they already exist in DB
		db.emoteSets.where({ id: sets[i].id, provider: "TWITCH" }).modify(sets[i]);
	}

	// Store the emote sets in the database
	db.emoteSets.bulkPut(sets);
}
