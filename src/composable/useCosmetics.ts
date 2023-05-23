import { Ref, reactive, ref, toRef } from "vue";
import { until, useTimeout } from "@vueuse/core";
import { DecimalToStringRGBA, RGBAToDecimal } from "@/common/Color";
import { log } from "@/common/Logger";
import { db } from "@/db/idb";
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
	userEmoteMap: {} as Record<string, Record<string, SevenTV.ActiveEmote>>,

	staticallyAssigned: {} as Record<string, Record<string, never> | undefined>,
});

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
			data.cosmetics = {};

			for (const cos of result) {
				if (data.cosmetics[cos.id]) continue;
				data.cosmetics[cos.id] = reactive(cos);

				if (cos.kind === "PAINT") {
					updatePaintStyle(cos as SevenTV.Cosmetic<"PAINT">);
				}
			}
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
	function watchSet(userID: string, setID: SevenTV.ObjectID): Ref<SevenTV.EmoteSet | null> {
		const es = ref<SevenTV.EmoteSet | null>(null);

		data.userEmoteMap[userID] = {};

		useLiveQuery(
			() => db.emoteSets.where("id").equals(setID).first(),
			(res) => {
				es.value = res; // assign to value

				data.sets[setID] = es.value;

				// Re-assign the user's personal emote map
				data.userEmoteMap[userID] = es.value.emotes
					.filter((ae) => ae.data && ae.data.state?.includes("PERSONAL")) // filter out emotes that are not personal-use approved
					.reduce((acc, cur) => ({ ...acc, [cur.name]: cur }), {} as Record<string, SevenTV.ActiveEmote>);

				// Update the set's data
				data.userEmoteSets[userID]?.set(setID, es.value);
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

		if (!data.userEmoteSets[userID]) data.userEmoteSets[userID] = new Map();
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

	// Assign stored entitlementsdb.entitlements
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
	if (!data.userEmoteMap[userID]) data.userEmoteMap[userID] = {};

	return reactive({
		paints: toRef(data.userPaints, userID),
		badges: toRef(data.userBadges, userID),
		emotes: toRef(data.userEmoteMap, userID),
		emoteSets: toRef(data.userEmoteSets, userID),
	});
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

const foo: SevenTV.CosmeticPaint = {
	name: "test",
	color: null,
	gradients: [
		{
			function: "LINEAR_GRADIENT",
			at: [0, 0.5],
			size: [0.5, 0.5],
			canvas_repeat: "no-repeat",
			stops: [
				{
					color: 4847841,
					at: 0,
				},
				{
					color: -555114,
					at: 1,
				},
			],
			repeat: false,
		},
		{
			function: "LINEAR_GRADIENT",
			angle: 45,
			at: [0.25, 0.5],
			size: [0.5, 0.5],
			canvas_repeat: "no-repeat",
			stops: [
				{
					color: RGBAToDecimal(255, 0, 0, 86),
					at: 0,
				},
				{
					color: RGBAToDecimal(0, 255, 0, 86),
					at: 1,
				},
			],
			repeat: false,
		},
	],
	text: {
		weight: 7,
		stroke: {
			color: RGBAToDecimal(60, 10, 10, 255),
			width: 0.25,
		},
		shadows: [
			{
				color: RGBAToDecimal(255, 0, 0, 255),
				radius: 8,
				x_offset: 0,
				y_offset: 0,
			},
			{
				color: RGBAToDecimal(0, 255, 0, 255),
				radius: 8,
				x_offset: 4,
				y_offset: -4,
			},
			{
				color: RGBAToDecimal(0, 0, 255, 255),
				radius: 8,
				x_offset: 4,
				y_offset: 4,
			},
			{
				color: RGBAToDecimal(170, 60, 255, 255),
				radius: 8,
				x_offset: -4,
				y_offset: 2,
			},
		],
	},
};

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
		if (!paint.data.shadows) {
			return "";
		}

		return paint.data.shadows
			.map((v) => `drop-shadow(${v.x_offset}px ${v.y_offset}px ${v.radius}px ${DecimalToStringRGBA(v.color)})`)
			.join(" ");
	})();

	const selector = `.seventv-paint[data-seventv-paint-id="${paint.id}"]`;
	const text = `${selector} {
color: ${paint.data.color ? DecimalToStringRGBA(paint.data.color) : "transparent"};
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

	let i = 0;
	for (const r of Array.from(sheet.cssRules)) {
		i++;

		if (!(r instanceof CSSStyleRule)) continue;
		if (r.selectorText !== selector) continue;

		sheet.deleteRule(i - 1);
		break;
	}
	if (remove) return;

	sheet.insertRule(text, sheet.cssRules.length);
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

updatePaintStyle({
	id: "test",
	kind: "PAINT",
	provider: "7TV",
	data: foo,
} as SevenTV.Cosmetic<"PAINT">);
