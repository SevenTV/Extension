import { Ref, reactive, ref, toRef, toRefs } from "vue";
import { until, useTimeout } from "@vueuse/core";
import { useStore } from "@/store/main";
import { log } from "@/common/Logger";
import { useLiveQuery } from "./useLiveQuery";
import { useWorker } from "./useWorker";
import { db } from "@/db/idb";

const data = reactive({
	cosmetics: {} as Record<SevenTV.ObjectID, SevenTV.Cosmetic>,
	sets: {} as Record<SevenTV.ObjectID, SevenTV.EmoteSet>,
	activeSets: new Set<SevenTV.ObjectID>(),

	entitlementBuffers: {
		"+": [] as SevenTV.Entitlement[],
		"-": [] as SevenTV.Entitlement[],
	},

	userBadges: {} as Record<string, SevenTV.Cosmetic<"BADGE">[]>,
	userPaints: {} as Record<string, SevenTV.Cosmetic<"PAINT">[]>,
	userEmoteSets: {} as Record<string, SevenTV.EmoteSet[]>,
	userEmoteMap: {} as Record<string, Record<string, SevenTV.ActiveEmote>>,

	staticallyAssigned: {} as Record<string, Record<string, never> | undefined>,
});

let flushTimeout: number | null = null;

/**
 * Set up cosmetics
 */
db.ready().then(async () => {
	const { platform, channel } = toRefs(useStore());
	const { target } = useWorker();

	const cosmeticsFetched = ref(false);

	useLiveQuery(
		() => db.cosmetics.toArray(),
		(result) => {
			data.cosmetics = {};

			for (const cos of result) {
				data.cosmetics[cos.id] = cos;
			}

			cosmeticsFetched.value = true;
		},
	);

	// Assign legacy V2 static cosmetics
	target.addEventListener(
		"static_cosmetics_fetched",
		(e) => {
			const { badges, paints } = e.detail;

			// Assign legacy static badges
			for (const badge of badges) {
				for (const u of badge.user_ids) {
					if (data.userBadges[u]) continue;

					data.userBadges[u] = [badge];
					data.staticallyAssigned[u] = {};
				}

				badge.user_ids.length = 0;

				data.cosmetics[badge.id] = badge;
			}

			// Assign legacy static paints
			for (const paint of paints) {
				for (const u of paint.user_ids) {
					if (data.userPaints[u]) continue;

					data.userPaints[u] = [paint];
					data.staticallyAssigned[u] = {};
				}

				paint.user_ids.length = 0;

				data.cosmetics[paint.id] = paint;
			}
		},
		{ once: true },
	);

	await until(cosmeticsFetched).toBeTruthy();
	await until(channel).not.toBeNull();

	/**
	 * Bind or unbind an entitlement to a user
	 *
	 * @param ent The entitlement to bind or unbind
	 * @param mode "+" to bind, "-" to unbind
	 */
	function setEntitlement(ent: SevenTV.Entitlement, mode: "+" | "-") {
		if (data.staticallyAssigned[ent.user_id]) {
			// If user had statically assigned cosmetics,
			// clear them so they be properly set with live data
			data.userBadges[ent.user_id] = [];
			data.userPaints[ent.user_id] = [];
			delete data.staticallyAssigned[ent.user_id];
		}

		data.entitlementBuffers[mode].push(ent);

		flush();
	}

	// Flush schedules the entitlement buffer
	//
	// This operation processes a time gap between grants and revokations
	// in order to allow the UI to update smoothly
	function flush() {
		if (flushTimeout) return;

		flushTimeout = window.setTimeout(() => {
			const add = data.entitlementBuffers["+"].splice(0, data.entitlementBuffers["+"].length);
			const del = data.entitlementBuffers["-"].splice(0, data.entitlementBuffers["-"].length);

			for (const ent of del) {
				const l = userListFor(ent.kind);
				if (!l[ent.user_id]) continue;

				const idx = l[ent.user_id].findIndex((b) => b.id === ent.ref_id);
				if (idx !== -1) l[ent.user_id].splice(idx, 1);
			}

			flushTimeout = window.setTimeout(async () => {
				for (const ent of add) {
					const l = userListFor(ent.kind);
					if (!l[ent.user_id]) l[ent.user_id] = [];

					if (ent.kind === "EMOTE_SET") {
						bindUserEmotes(ent.user_id, ent.ref_id);
					} else {
						awaitCosmetic(ent.ref_id).then((cos) => {
							const idx = l[ent.user_id].findIndex((b) => b.id === ent.ref_id);
							if (idx === -1) {
								l[ent.user_id].push(cos as never);
							}
						});
					}
				}
			}, 10);

			flushTimeout = null;
		}, 10);
	}

	// Wait for a given cosmetic's data to become available
	function awaitCosmetic(id: SevenTV.ObjectID) {
		return until(data.cosmetics[id]).not.toBeUndefined();
	}

	// Get the list of cosmetics for a given entitlement kind
	function userListFor(kind: SevenTV.EntitlementKind) {
		return {
			BADGE: data.userBadges,
			PAINT: data.userPaints,
			EMOTE_SET: data.userEmoteSets,
		}[kind];
	}

	// Watch a user's personal emote set for creation or changes
	function watchSet(userID: string, setID: SevenTV.ObjectID): Ref<SevenTV.EmoteSet | null> {
		const es = ref<SevenTV.EmoteSet | null>(null);

		data.userEmoteMap[userID] = {};

		useLiveQuery(
			() => db.emoteSets.where("id").equals(setID).first(),
			(res) => {
				es.value = res; // assign to value

				data.sets[setID] = es.value;

				// Re-assign the user's personal emote map
				data.userEmoteMap[userID] = es.value.emotes.reduce(
					(acc, cur) => ({ ...acc, [cur.name]: { ...cur, provider: "7TV", scope: "PERSONAL" } }),
					{} as Record<string, SevenTV.ActiveEmote>,
				);

				// Update the set's data
				data.userEmoteSets[userID]?.splice(data.userEmoteSets[userID].indexOf(es.value), 1, es.value);
			},
			{
				until: until(data.userEmoteMap[userID])
					.toBeUndefined()
					.then(() => true),
			},
		);

		return es;
	}

	// Bind a user's personal emote set
	async function bindUserEmotes(userID: string, setID: string) {
		const es = watchSet(userID, setID);

		// Wait until set becomes available
		// or timeout after 10 seconds
		const set = await Promise.race([
			until(es).not.toBeNull(),
			until(useTimeout(10000))
				.toBeTruthy()
				.then(() => null),
		]);

		if (!set) {
			delete data.userEmoteMap[userID];

			log.warn("<Cosmetics>", "Emote Set could not be found", `id=${setID}`);
			return;
		}

		if (!data.userEmoteSets[userID]) data.userEmoteSets[userID] = [];
		const idx = data.userEmoteSets[userID].findIndex((s) => s.id === set.id);
		if (idx === -1) {
			data.userEmoteSets[userID].push(set);
		}

		log.info("<Cosmetics>", "Assigned Emote Set to user", `id=${setID}`, `userID=${userID}`);
	}

	// Handle user entitlements
	target.addEventListener("entitlement_created", (ev) => {
		setEntitlement(ev.detail, "+");
	});
	target.addEventListener("entitlement_deleted", (ev) => {
		setEntitlement(ev.detail, "-");
	});

	// Assign stored entitlementsdb.entitlements
	db.entitlements
		.where("scope")
		.equals(`${platform.value}:${channel.value!.id ?? "X"}`)
		.toArray()
		.then((ents) => {
			for (const ent of ents) {
				let assigned = false;

				const isLegacy = !!data.staticallyAssigned[ent.user_id];
				switch (ent.kind) {
					case "BADGE":
						if (!isLegacy && data.userBadges[ent.user_id]) continue;

						data.userBadges[ent.user_id] = [data.cosmetics[ent.ref_id] as SevenTV.Cosmetic<"BADGE">];
						assigned = true;
						break;
					case "PAINT":
						if (!isLegacy && data.userPaints[ent.user_id]) continue;

						data.userPaints[ent.user_id] = [data.cosmetics[ent.ref_id] as SevenTV.Cosmetic<"PAINT">];
						assigned = true;
						break;
					case "EMOTE_SET":
						bindUserEmotes(ent.user_id, ent.ref_id);
						break;
				}

				log.debug("<Cosmetics>", "Assigned", ents.length.toString(), "stored entitlements");

				if (assigned) {
					data.staticallyAssigned[ent.user_id] = {};
				}
			}
		});
});

export function useCosmetics(userID: string) {
	if (!data.userBadges[userID]) data.userBadges[userID] = [];
	if (!data.userPaints[userID]) data.userPaints[userID] = [];
	if (!data.userEmoteMap[userID]) data.userEmoteMap[userID] = {};

	return {
		paints: toRef(data.userPaints, userID),
		badges: toRef(data.userBadges, userID),
		emotes: toRef(data.userEmoteMap, userID),
		emoteSets: toRef(data.userEmoteSets, userID),
	};
}
