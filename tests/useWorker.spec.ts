import { useWorker } from "@/composable/useWorker";
import { describe, expect, it } from "vitest";

function makeChannel(id: string): CurrentChannel {
	return {
		id,
		username: id,
		displayName: id,
		active: true,
	};
}

describe("WorkletTarget.listenUntil", () => {
	it("resolves once the predicate matches and stops listening", async () => {
		const { target } = useWorker();

		let resolved = false;
		const p = target.listenUntil("channel_fetched", (ev) => ev.detail.id === "ch1");
		target.emit("channel_fetched", makeChannel("ch1"));
		await p;
		resolved = true;

		expect(resolved).toBe(true);
	});

	it("does not leak listeners after resolution", async () => {
		const { target } = useWorker();

		let predicateCalls = 0;
		const makePredicate = (id: string) => (ev: { detail: { id: string } }) => {
			predicateCalls++;
			return ev.detail.id === id;
		};

		for (let i = 0; i < 5; i++) {
			const p1 = target.listenUntil("channel_fetched", makePredicate("ch1"));
			const p2 = target.listenUntil("channel_sets_fetched", makePredicate("ch1"));
			target.emit("channel_fetched", makeChannel("ch1"));
			target.emit("channel_sets_fetched", makeChannel("ch1"));
			await Promise.all([p1, p2]);
		}

		predicateCalls = 0;
		target.emit("channel_fetched", makeChannel("OTHER"));
		target.emit("channel_sets_fetched", makeChannel("OTHER"));

		expect(predicateCalls).toBe(0);
	});
});
