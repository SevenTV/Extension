import { log } from "@/common/Logger";
import { NetWorkerMessageType, NetWorkerInstance, TypedNetWorkerMessage, NetWorkerMessage } from ".";
import { seventv, betterttv, frankerfacez, onChannelChange } from "./net.http.worker";
import { ws } from "./net.events.worker";
import { WebSocketPayload } from "./events";
import { db } from "@/db/IndexedDB";

const w = self as unknown as DedicatedWorkerGlobalScope;

// Set up logger
log.setContextName("NetWorker");

// Set up a BroadcastChannel to communicate with the workers
const bc = new BroadcastChannel("SEVENTV#Network");

const PING_INTERVAL = 6000;
const instances = {} as Record<string, NetWorkerInstance>;
const state = {
	id: 0,
	online: false,
	primary: false,
} as NetWorkerInstance;

export const primaryExists = () => Object.values(instances).some((i) => i.primary);
export const isPrimary = () => state.primary;

// Listen to global messages
let electionTimeout = 0;

// Listen to messages from the parent tab
w.onmessage = async (ev) => {
	if (ev.data.source !== "SEVENTV") {
		return; // not a message from us
	}

	switch (ev.data.type as NetWorkerMessageType) {
		// Receive the ID from the tab
		case NetWorkerMessageType.INIT: {
			const msg = ev.data as NetWorkerMessage<NetWorkerMessageType.INIT>;
			state.id = msg.data.id;
			state.online = true;

			// Scan the network for other tabs
			instances[state.id] = state;

			// If no other tabs are found, we will become the primary
			electionTimeout = setTimeout(runPrimaryElection, 1000);

			broadcastMessage(NetWorkerMessageType.STATE, {});

			log.debug("Initialized as #" + msg.data.id);
			break;
		}
		case NetWorkerMessageType.STATE: {
			const msg = ev.data as NetWorkerMessage<NetWorkerMessageType.STATE>;
			if (!msg.data.local) return;

			state.local = msg.data.local;
			broadcastMessage(NetWorkerMessageType.STATE, { local: state.local });

			await db.ready();

			// Load local data
			// todo: make this better
			if (state.local.channel) {
				onChannelChange(state.local.channel);
			}

			log.debug("<NetWorker>", "Local State Updated", JSON.stringify(state.local));
			break;
		}

		default:
			break;
	}
};

bc.onmessage = (ev) => {
	if (ev.data.source !== "SEVENTV") return;
	// ignore if "to" is set and it's not us
	if (ev.data.to && ev.data.to !== state.id) return;

	switch (ev.data.type as NetWorkerMessageType) {
		case NetWorkerMessageType.STATE: {
			const msg = ev.data as NetWorkerMessage<NetWorkerMessageType.STATE>;

			const exists = !!instances[msg.from.id];

			if (!exists && msg.from.online) {
				instances[msg.from.id] = msg.from;

				// Broadcast presence to the network
				if (!msg.to) {
					broadcastMessage(NetWorkerMessageType.STATE, {}, msg.from.id);
				}

				// Set timeout
				// This instance will be dereferenced if it does not ping
				setInstanceTimeout(msg.from);

				log.debug("<Net>", `#${msg.from.id}`, "joined");
			} else {
				const inst = instances[msg.from.id];

				inst.primary = msg.from.primary;
				inst.online = msg.from.online;
				inst.primary_vote = msg.from.primary_vote;
				inst.local = msg.from.local;

				if (inst.primary) {
					log.debug("<Net>", `#${msg.from.id}`, "elected as primary");
				}
			}

			// after a second without new state updates,
			// we will run a primary election
			clearInterval(electionTimeout);
			electionTimeout = setTimeout(runPrimaryElection, 1000);
			break;
		}
		// Another instance asks us if we are still alive
		case NetWorkerMessageType.PING: {
			const msg = ev.data as NetWorkerMessage<NetWorkerMessageType.PING>;

			broadcastMessage(NetWorkerMessageType.PONG, {}, msg.from.id);
			break;
		}
		// Another instance tells us that it is still alive
		case NetWorkerMessageType.PONG: {
			const msg = ev.data as NetWorkerMessage<NetWorkerMessageType.PONG>;

			// Reset timeout
			const inst = instances[msg.from.id];
			if (!inst) return; // instance not stored

			clearTimeout(inst._timeout);
			setInstanceTimeout(inst);
			break;
		}
		case NetWorkerMessageType.MESSAGE: {
			if (ev.data.from.id === state.id) return; // ignore messages from self
			const msg = ev.data as NetWorkerMessage<NetWorkerMessageType.MESSAGE>;

			ws.pushMessage(msg.data);
			break;
		}
		default:
			break;
	}
};

// Set up pinging
setInterval(() => {
	broadcastMessage(NetWorkerMessageType.PING, {});
}, PING_INTERVAL);

function runPrimaryElection(exclude?: number): void {
	const instanceList = Object.values(instances).filter((i) => i.id !== exclude);

	const primaryExists = instanceList.some((i) => i.primary);
	if (!primaryExists) {
		// There is only one instance, so it is the primary
		if (instanceList.length === 1) {
			becomePrimary();

			return;
		}

		// Tally votes
		const votes = instanceList
			.filter((i) => typeof i.primary_vote === "number")
			.map((i) => i.primary_vote as number);
		if (votes.length >= instanceList.length - 1) {
			// all the votes are in. we can now elect a primary
			const primary = instanceList.find((i) => i.primary_vote === Math.max(...votes));
			if (!primary || primary.id !== state.id) return;

			// if we are the primary, declare our authority status to the network
			becomePrimary();

			return;
		} else {
			// check again in a bit if the election couldn't pass
			setTimeout(() => runPrimaryElection(exclude), 500);
		}

		// Pick the highest ID as the favored to become primary
		const highest = instanceList.reduce((a, b) => (a.id > b.id ? a : b), state);
		state.primary_vote = highest.id;

		// Cast our vote
		broadcastMessage(NetWorkerMessageType.STATE, {});
	}
}

function becomePrimary(): void {
	state.primary = true;

	// Connect to the WebSocket
	ws.connect();
	ws.getSocket()?.addEventListener("message", (ev: MessageEvent) => {
		const msg = JSON.parse(ev.data) as WebSocketPayload<unknown>;

		// push the message to self
		ws.pushMessage(msg);
		// broadcast the message to the network
		broadcastMessage(NetWorkerMessageType.MESSAGE, msg);
	});

	broadcastMessage(NetWorkerMessageType.STATE, {});
	log.info("<Net>", "Elected as primary");

	// Load global emote sets
	seventv.loadGlobalSet();
	betterttv.loadGlobalEmoteSet();
	frankerfacez.loadGlobalEmoteSet();
}

function broadcastMessage<T extends NetWorkerMessageType>(t: T, data: TypedNetWorkerMessage<T>, to?: number): void {
	bc.postMessage({
		source: "SEVENTV",
		type: t,
		from: {
			id: state.id,
			online: state.online,
			primary: state.primary,
			primary_vote: state.primary_vote,
		} as NetWorkerInstance,
		to,
		data,
	});
}

export function sendTabNotify(key: string): void {
	w.postMessage({
		source: "SEVENTV",
		type: NetWorkerMessageType.NOTIFY,
		data: { key },
	});
}

export function sendToPrimary<T extends NetWorkerMessageType>(t: T, data: TypedNetWorkerMessage<T>): void {
	const primaryInst = Object.values(instances).find((inst) => inst.primary);
	if (!primaryInst) return;

	broadcastMessage(t, data, primaryInst.id);
}

function setInstanceTimeout(inst: NetWorkerInstance): void {
	inst._timeout = setTimeout(() => {
		delete instances[inst.id];

		log.debug("<Net>", `#${inst.id} timed out`);

		// Primary has quit, we must elect a new one
		const primaryExists = Object.values(instances).some((i) => i.primary);
		if (!primaryExists) {
			log.debug("<Net>", `#${inst.id} was primary, but has quit. Running primary election.`);
			runPrimaryElection(inst.id);
		}
	}, PING_INTERVAL * 1.25);
}
