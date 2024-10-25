import { ComputedRef, computed, reactive, toRef, watch } from "vue";
import { until, useTimeout } from "@vueuse/core";
import { DecimalToStringRGBA } from "@/common/Color";
import { log } from "@/common/Logger";
import { db } from "@/db/idb";
import { useConfig } from "@/composable/useSettings";
import { useLiveQuery } from "./useLiveQuery";
import { useWorker } from "./useWorker";

const data = reactive({
	cosmetics: {} as Record<SevenTV.ObjectID, SevenTV.Cosmetic>,
	sets: {} as Record<SevenTV.ObjectID, SevenTV.EmoteSet>,
	activeSets: new Set<SevenTV.ObjectID>(),

	entitlementBuffers: {
		"+": [] as SevenTV.Entitlement[],
		"-": [] as SevenTV.Entitlement[],
	},

	userBadges: {} as Record<string, CosmeticMap<"BADGE">>,
	userPaints: {} as Record<string, CosmeticMap<"PAINT">>,
	userEmoteSets: {} as Record<string, Map<string, SevenTV.EmoteSet>>,
	userEmoteMap: {} as Record<string, ComputedRef<Record<string, SevenTV.ActiveEmote>>>,

	staticallyAssigned: {} as Record<string, Record<string, never> | undefined>,
});
const dropShadowRender = useConfig<0 | 1 | 2>("vanity.paints_drop_shadows");

watch(dropShadowRender, () =>
	Object.values(data.cosmetics)
		.filter((c) => c.kind === "PAINT")
		.forEach((c) => updatePaintStyle(c as SevenTV.Cosmetic<"PAINT">)),
);

class CosmeticMap<T extends SevenTV.CosmeticKind> extends Map<string, SevenTV.Cosmetic<T>> {
	private providers = new Set<SevenTV.Provider>();

	hasProvider(provider: SevenTV.Provider) {
		return this.providers.has(provider);
	}

	set(key: string, value: SevenTV.Cosmetic<T>): this {
		if (value.provider) this.providers.add(value.provider);
		return super.set(key, value);
	}

	delete(key: string): boolean {
		const value = this.get(key);
		if (!value) return false;

		this.providers.delete(value.provider);
		return super.delete(key);
	}

	clear(): void {
		this.providers.clear();
		super.clear();
	}
}

let flushTimeout: number | null = null;

/**
 * Set up cosmetics
 */
db.ready().then(async () => {
	const { target } = useWorker();

	useLiveQuery(
		() => db.cosmetics.toArray(),
		(result) => {
			const temp = {} as typeof data.cosmetics;

			for (const cos of result) {
				if (temp[cos.id]) continue;
				temp[cos.id] = reactive(cos);

				if (cos.kind === "PAINT") {
					updatePaintStyle(cos as SevenTV.Cosmetic<"PAINT">);
				}
			}

			data.cosmetics = temp;
		},
	);

	// Assign legacy V2 static cosmetics
	target.addEventListener(
		"static_cosmetics_fetched",
		(e) => {
			const { badges, paints } = e.detail;

			// Assign legacy static badges
			for (let badge of badges ?? []) {
				if (!data.cosmetics[badge.id]) data.cosmetics[badge.id] = reactive(badge);
				else badge = data.cosmetics[badge.id] as SevenTV.Cosmetic<"BADGE">;

				for (const u of badge.user_ids ?? []) {
					if (!u || (data.userBadges[u] && data.userBadges[u].has(badge.id))) continue;

					setEntitlement(
						{
							id: "",
							kind: "BADGE",
							ref_id: badge.id,
							user_id: u,
						},
						"+",
					);
					data.staticallyAssigned[u] = {};
				}

				if (badge.user_ids) {
					badge.user_ids.length = 0;
				}
			}

			// Assign legacy static paints
			for (let paint of paints ?? []) {
				if (!data.cosmetics[paint.id]) data.cosmetics[paint.id] = reactive(paint);
				else paint = data.cosmetics[paint.id] as SevenTV.Cosmetic<"PAINT">;

				for (const u of paint.user_ids ?? []) {
					if (!u || data.userPaints[u]) continue;

					setEntitlement(
						{
							id: "",
							kind: "PAINT",
							ref_id: paint.id,
							user_id: u,
						},
						"+",
					);
					data.staticallyAssigned[u] = {};
				}

				if (paint.user_ids) {
					paint.user_ids.length = 0;
				}

				updatePaintStyle(paint);
			}
		},
		{ once: true },
	);

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
			for (const cos of data.userBadges[ent.user_id]?.values() ?? []) {
				if (cos.provider !== "7TV") continue;

				data.userBadges[ent.user_id].delete(cos.id);
			}
			for (const cos of data.userPaints[ent.user_id]?.values() ?? []) {
				data.userPaints[ent.user_id].delete(cos.id);
			}

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
				if (!l[ent.user_id] || !l[ent.user_id].has(ent.ref_id)) continue;

				l[ent.user_id].delete(ent.ref_id);
			}

			flushTimeout = window.setTimeout(async () => {
				for (const ent of add) {
					const l = userListFor(ent.kind);

					if (ent.kind === "EMOTE_SET") {
						if (!l[ent.user_id]) l[ent.user_id] = new Map();

						bindUserEmotes(ent.user_id, ent.ref_id);
					} else {
						if (!l[ent.user_id]) (l[ent.user_id] as CosmeticMap<"BADGE" | "PAINT">) = new CosmeticMap();

						const m = l[ent.user_id] as CosmeticMap<"BADGE" | "PAINT">;
						awaitCosmetic(ent.ref_id).then((cos) => {
							if (m.has(ent.ref_id) || m.hasProvider(cos.provider)) return;

							m.set(ent.ref_id, cos as never);
						});
					}
				}
			}, 10);

			flushTimeout = null;
		}, 10);
	}

	// Wait for a given cosmetic's data to become available
	function awaitCosmetic(id: SevenTV.ObjectID) {
		const cos = data.cosmetics[id];
		if (cos) return Promise.resolve(cos);

		return until(() => data.cosmetics[id]).not.toBeUndefined();
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
	function watchSet(userID: string, setID: SevenTV.ObjectID) {
		return new Promise<SevenTV.EmoteSet | null>((resolve) => {
			useLiveQuery(
				() => db.emoteSets.where("id").equals(setID).first(),
				(res) => {
					data.sets[setID] = res;

					// Update the set's data
					data.userEmoteSets[userID]?.set(setID, res);
					resolve(res);
				},
				{
					until: until(useTimeout(10000))
						.toBeTruthy()
						.then(() => resolve(null))
						.then(() => true),
					count: 1,
				},
			);
		});
	}

	// Bind a user's personal emote set
	async function bindUserEmotes(userID: string, setID: string) {
		const set = await watchSet(userID, setID);

		if (!set) {
			log.warn("<Cosmetics>", "Emote Set could not be found", `id=${setID}`);
			return;
		}

		if (!data.userEmoteSets[userID]) {
			data.userEmoteSets[userID] = new Map();
		}
		if (!data.userEmoteSets[userID].has(setID)) {
			data.userEmoteSets[userID].set(setID, set);
		}

		log.debug("<Cosmetics>", "Assigned Emote Set to user", `id=${setID}`, `userID=${userID}`);
	}

	// Handle user entitlements
	target.addEventListener("entitlement_created", (ev) => {
		setEntitlement(ev.detail, "+");
	});
	target.addEventListener("entitlement_deleted", (ev) => {
		setEntitlement(ev.detail, "-");
	});

	// Assign stored entitlements
	db.entitlements.toArray().then((ents) => {
		for (const ent of ents) {
			let assigned = false;

			const isLegacy = !!data.staticallyAssigned[ent.user_id];
			switch (ent.kind) {
				case "BADGE":
					if (!isLegacy && data.userBadges[ent.user_id]?.size) continue;

					setEntitlement(ent, "+");
					assigned = true;
					break;
				case "PAINT":
					if (!isLegacy && data.userPaints[ent.user_id]?.size) continue;

					setEntitlement(ent, "+");
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
	if (!data.userBadges[userID]) data.userBadges[userID] = new CosmeticMap();
	if (!data.userPaints[userID]) data.userPaints[userID] = new CosmeticMap();
	if (!data.userEmoteSets[userID]) data.userEmoteSets[userID] = new Map();
	if (!data.userEmoteMap[userID])
		data.userEmoteMap[userID] = computed(() => {
			const un = {} as Record<string, SevenTV.ActiveEmote>;
			for (const set of data.userEmoteSets[userID].values()) {
				for (const emote of set.emotes) {
					if (!emote.data?.state?.includes("PERSONAL")) continue;
					un[emote.name] = emote;
				}
			}
			return un;
		});

	return reactive({
		paints: toRef(data.userPaints, userID),
		badges: toRef(data.userBadges, userID),
		emotes: toRef(data.userEmoteMap, userID),
		emoteSets: toRef(data.userEmoteSets, userID),
	});
}

export function getCosmetics() {
	return data;
}

let paintSheet: CSSStyleSheet | null = null;
function getPaintStylesheet(): CSSStyleSheet | null {
	if (paintSheet) return paintSheet;

	const link = document.createElement("link");
	link.type = "text/css";
	link.rel = "stylesheet";

	const s = document.createElement("style");
	s.id = "seventv-paint-styles";

	document.head.appendChild(s);

	return (paintSheet = s.sheet ?? null);
}

// This defines CSS variables in our global paint stylesheet for the given paint
export function updatePaintStyle(paint: SevenTV.Cosmetic<"PAINT">, remove = false): void {
	const sheet = getPaintStylesheet();
	if (!sheet) {
		log.error("<Cosmetics>", "Could not find paint stylesheet");
		return;
	}

	if (!paint.data.gradients?.length && paint.data.function) {
		// add base gradient if using v2 format
		if (!paint.data.gradients) paint.data.gradients = new Array(1);
		paint.data.gradients[0] = {
			function: paint.data.function,
			canvas_repeat: "",
			size: [1, 1],
			shape: paint.data.shape,
			image_url: paint.data.image_url,
			stops: paint.data.stops ?? [],
			repeat: paint.data.repeat ?? false,
			angle: paint.data.angle,
		};
	}

	const gradients = paint.data.gradients.map((g) => createGradientFromPaint(g));
	const filter = (() => {
		if (!paint.data.shadows || dropShadowRender.value == 0) {
			return "";
		}

		return paint.data.shadows
			.slice(0, dropShadowRender.value == 2 ? 1 : undefined)
			.map((v) => createFilterDropshadow(v))
			.join(" ");
	})();

	const selector = `.seventv-paint[data-seventv-paint-id="${paint.id}"]`;
	const text = `${selector} {
color: ${paint.data.color ? DecimalToStringRGBA(paint.data.color) : "inherit"};
background-image: ${gradients.map((v) => v[0]).join(", ")};
background-position: ${gradients.map((v) => v[1]).join(", ")};
background-size: ${gradients.map((v) => v[2]).join(", ")};
background-repeat: ${gradients.map((v) => v[3]).join(", ")};
filter: ${filter || "inherit"};
${
	paint.data.text
		? `
font-weight: ${paint.data.text.weight ? paint.data.text.weight * 100 : "inherit"};
-webkit-text-stroke-width: ${paint.data.text.stroke ? `${paint.data.text.stroke.width}px` : "inherit"};
-webkit-text-stroke-color: ${paint.data.text.stroke ? DecimalToStringRGBA(paint.data.text.stroke.color) : "inherit"};
text-shadow: ${
				paint.data.text.shadows
					?.map((v) => `${v.x_offset}px ${v.y_offset}px ${v.radius}px ${DecimalToStringRGBA(v.color)}`)
					.join(", ") ?? "unset"
		  };
text-transform: ${paint.data.text.transform ?? "unset"};
`
		: ""
}
}
`;

	let currenIndex = -1;
	for (let i = 0; i < sheet.cssRules.length; i++) {
		const r = sheet.cssRules[i];
		if (!(r instanceof CSSStyleRule)) continue;
		if (r.selectorText !== selector) continue;

		currenIndex = i;
		break;
	}
	if (remove) return;

	if (currenIndex >= 0) {
		sheet.deleteRule(currenIndex);
		sheet.insertRule(text, currenIndex);
	} else {
		sheet.insertRule(text, sheet.cssRules.length);
	}
}

export function createGradientFromPaint(
	gradient: SevenTV.CosmeticPaintGradient,
): [style: string, pos: string, size: string, repeat: string] {
	const result = ["", "", "", ""] as [string, string, string, string];

	const args = [] as string[];
	switch (gradient.function) {
		case "LINEAR_GRADIENT": // paint is linear gradient
			args.push(`${gradient.angle ?? 0}deg`);
			break;
		case "RADIAL_GRADIENT": // paint is radial gradient
			args.push(gradient.shape ?? "circle");
			break;
		case "URL": // paint is an image
			args.push(gradient.image_url ?? "");
			break;
	}
	let funcPrefix = "";
	if (gradient.function !== "URL") {
		funcPrefix = gradient.repeat ? "repeating-" : "";

		for (const stop of gradient.stops) {
			const color = DecimalToStringRGBA(stop.color);
			args.push(`${color} ${stop.at * 100}%`);
		}
	}

	result[0] = `${funcPrefix}${gradient.function.toLowerCase().replace("_", "-")}(${args.join(", ")})`;
	result[1] = gradient.at && gradient.at.length === 2 ? `${gradient.at[0] * 100}% ${gradient.at[1] * 100}%` : "";
	result[2] =
		gradient.size && gradient.size.length === 2 ? `${gradient.size[0] * 100}% ${gradient.size[1] * 100}%` : "";
	result[3] = gradient.canvas_repeat ?? "unset";

	return result;
}

export function createFilterDropshadow(shadow: SevenTV.CosmeticPaintShadow): string {
	return `drop-shadow(${shadow.x_offset}px ${shadow.y_offset}px ${shadow.radius}px ${DecimalToStringRGBA(
		shadow.color,
	)})`;
}
