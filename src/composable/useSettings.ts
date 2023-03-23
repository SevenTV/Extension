import { Ref, customRef, reactive } from "vue";
import { log } from "@/common/Logger";
import { db } from "@/db/idb";
import { useFrankerFaceZ } from "./useFrankerFaceZ";
import { useLiveQuery } from "./useLiveQuery";

const raw = reactive({} as Record<string, SevenTV.SettingType>);
const nodes = reactive({} as Record<string, SevenTV.SettingNode>);

const ffz = useFrankerFaceZ();

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
	for (const { key, value, timestamp } of s) {
		const cur = nodes[key];
		if (cur && cur.timestamp && timestamp && cur.timestamp >= timestamp) continue;

		raw[key] = value;
		nodes[key] = {
			...(nodes[key] ?? {}),
			timestamp,
		} as SevenTV.SettingNode;
	}
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
