import { WorkerDriver } from "./worker.driver";
import "./worker.http";

const w = self as unknown as SharedWorkerGlobalScope;
const shared = "onconnect" in self;

(() => new WorkerDriver(w))();

// Dedicated workers use a transferred port to reuse the shared worker protocol.
if (!shared) {
	self.addEventListener("message", (event: MessageEvent) => {
		if (event.data?.type !== "CONNECT" || !event.ports[0]) return;
		w.onconnect?.call(w, new MessageEvent("connect", { ports: [event.ports[0]] }));
	});
}
