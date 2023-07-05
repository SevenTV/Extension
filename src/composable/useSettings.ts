import { Ref, customRef, reactive } from "vue";
import { log } from "@/common/Logger";
import { db } from "@/db/idb";
import { useFrankerFaceZ } from "./useFrankerFaceZ";
import { useLiveQuery } from "./useLiveQuery";
import { saveAs } from "file-saver";

// import { useStore } from "@/store/main";

const raw = reactive({} as Record<string, SevenTV.SettingType>);
const nodes = reactive({} as Record<string, SevenTV.SettingNode>);

const ffz = useFrankerFaceZ();

const deserializationFunctions: {
	[key: string]: (value: SevenTV.SettingType) => object;
} = {
	Map: (value) => {
		return new Map(value as Iterable<[string, SevenTV.SettingType]>);
	},
	Set: (value) => {
		return new Set(value as Iterable<SevenTV.SettingType>);
	},
};
// const { platform } = useStore();
/*
Uncaught (in promise) Error: [🍍]: "getActivePinia()" was called but there was no active Pinia. Did you forget to install pinia?
	const pinia = createPinia()
	app.use(pinia)
This will fail in production.
    at useStore (pinia.mjs:1699:19)
    at useSettings.ts:14:15
*/

export interface SerializedSettings {
	timestamp: number;
	settings: SerializedSetting[];
}

export interface SerializedSetting extends SevenTV.Setting<SevenTV.SettingType> {
	constructorName?: string;
}

function toConfigRef<T extends SevenTV.SettingType>(key: string, defaultValue?: T): Ref<T> {
	return customRef<T>((track, trigger) => {
		return {
			get() {
				track();
				return (raw[key] as T) ?? defaultValue;
			},
			set(newVal) {
				const n = nodes[key];
				// Only write the setting if it passes the optional predicate
				const predicate = n.predicate;
				if (predicate && !predicate(newVal)) return;

				raw[key] = newVal;
				trigger();

				// Write changes to the db
				db.settings
					.put({ key: key, type: typeof newVal, value: newVal }, key)
					.catch((err) => log.error("failed to write setting", key, "to db:", err));

				if (typeof n.effect === "function") {
					n.effect(newVal);
				}
			},
		};
	});
}

db.ready().then(() =>
	useLiveQuery(
		() => db.settings.toArray(),
		(s) => fillSettings(s),
	),
);

export async function fillSettings(s: SevenTV.Setting<SevenTV.SettingType>[]) {
	for (const { key, value, timestamp, serialize } of s) {
		const cur = nodes[key];
		if (cur && cur.timestamp && timestamp && cur.timestamp >= timestamp) continue;

		raw[key] = value;
		nodes[key] = {
			...(nodes[key] ?? {}),
			timestamp,
			serialize: serialize ?? true,
		} as SevenTV.SettingNode;
	}
}

export function getUnserializableSettings() {
	const out = [];
	for (const key of Object.keys(nodes)) {
		const node = nodes[key];

		if (node.serialize === false) {
			out.push(node);
			continue;
		}

		if (
			typeof node.defaultValue === "object" &&
			!Object.keys(deserializationFunctions).includes(node.defaultValue.constructor.name)
		) {
			out.push(node);
			continue;
		}
	}
	return out;
}

export async function exportSettings(platform: Platform) {
	return db.ready().then(async () => {
		const s = await db.settings.toArray();
		const serializedSettings: SerializedSetting[] = serializeSettings(
			s.filter((v) => v.key !== "app.version").filter((v) => v.serialize !== false),
		);
		log.debugWithObjects(["<Settings>", "Serialized settings"], [serializedSettings]);

		const out = JSON.stringify({
			timestamp: new Date().getTime(),
			settings: serializedSettings,
		} as SerializedSettings);
		const blob = new Blob([out], {
			type: "text/plain",
		});
		log.info("<Settings>", "Exporting settings");
		saveAs(blob, `7tv_settings_${platform}-${new Date().toLocaleDateString()}.json`);
	});
}

export function serializeSettings(settings: SevenTV.Setting<SevenTV.SettingType>[]) {
	const serialized: SerializedSetting[] = [];

	settings.forEach((setting: SevenTV.Setting<SevenTV.SettingType>) => {
		if (nodes[setting.key].serialize === false) return;

		if (typeof setting.value !== "object") {
			serialized.push(setting);
		} else if (Object.keys(deserializationFunctions).includes(setting.value.constructor.name)) {
			serialized.push({
				...setting,
				constructorName: setting.value.constructor.name,
				value: Array.from(setting.value as Iterable<object>),
			} as SerializedSetting);
		}
	});

	return serialized;
}

export function deserializeSettings(serialized: SerializedSettings) {
	if (!(serialized.settings instanceof Array)) throw new Error("invalid settings file: invalid format");

	const deserializedSettings: SevenTV.Setting<SevenTV.SettingType>[] = [];

	for (const { key, type, constructorName, value, timestamp } of serialized.settings) {
		if (key == undefined || type == undefined || value == undefined || timestamp == undefined)
			throw new Error("invalid settings file: missing keys");

		if (typeof value !== type) throw new Error(`invalid settings file: ${value} is not of type '${type}'`);

		if (type !== "object") {
			deserializedSettings.push({
				key,
				type,
				value,
			});
		} else {
			if (!constructorName) throw new Error("invalid settings file: missing 'constructorName' for object type");
			if (!Object.keys(deserializationFunctions).includes(constructorName))
				throw new Error(`invalid settings file: cannot deserialize constructor type '${constructorName}'`);

			const deserializedValue: object = deserializationFunctions[constructorName](value);

			deserializedSettings.push({
				key,
				type,
				value: deserializedValue,
			});
		}
	}

	return deserializedSettings;
}

export function useConfig<T extends SevenTV.SettingType>(key: string, defaultValue?: T) {
	return toConfigRef<T>(key, defaultValue);
}

export function synchronizeFrankerFaceZ() {
	const keys = Object.keys(nodes);
	for (let i = 0; i < keys.length; i++) {
		const n = nodes[Object.keys(nodes)[i]];
		if (!n.ffz_key || raw[n.key]) continue;

		ffz.getConfigChanges(n.ffz_key, (v) => {
			raw[n.key] = typeof n.ffz_transform === "function" ? n.ffz_transform(v) : (v as SevenTV.SettingType);
		});
	}
}

export function useSettings() {
	function register(newNodes: SevenTV.SettingNode[]) {
		for (const node of newNodes) {
			nodes[node.key] = {
				...node,
				timestamp: nodes[node.key]?.timestamp ?? undefined,
			};

			if (["string", "boolean", "object", "number", "undefined"].includes(typeof raw[node.key])) {
				raw[node.key] = raw[node.key] ?? node.defaultValue;
			}

			if (typeof node.effect === "function") {
				node.effect(raw[node.key]);
			}
		}
	}

	return {
		nodes,
		register,
	};
}

export function declareConfig<T extends SevenTV.SettingType, C = SevenTV.SettingNode.ComponentType>(
	key: string,
	comType: C,
	data: Omit<SevenTV.SettingNode<T, C>, "key" | "type">,
): SevenTV.SettingNode<SevenTV.SettingType, SevenTV.SettingNode.ComponentType> {
	return {
		key,
		type: comType,
		...data,
	} as SevenTV.SettingNode<SevenTV.SettingType, SevenTV.SettingNode.ComponentType>;
}
