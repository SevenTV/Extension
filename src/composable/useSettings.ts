import { Ref, customRef, reactive } from "vue";
import { db } from "@/db/idb";
import { useFrankerFaceZ } from "./useFrankerFaceZ";
import { useLiveQuery } from "./useLiveQuery";

const raw = reactive({} as Record<string, SevenTV.SettingType>);
const nodes = reactive({} as Record<string, SevenTV.SettingNode>);

const ffzSettings = useFrankerFaceZ();

function toConfigRef<T extends SevenTV.SettingType>(key: string): Ref<T> {
	return customRef<T>((track, trigger) => {
		return {
			get() {
				track();
				return raw[key] as T;
			},
			set(newVal) {
				const n = nodes[key];
				// Only write the setting if it passes the optional predicate
				const predicate = n.predicate;
				if (predicate && !predicate(newVal)) return;

				raw[key] = newVal;
				trigger();

				// Write changes to the db
				db.settings.put({ key: key, type: typeof newVal, value: newVal }, key);

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
	for (const { key, value } of s) {
		raw[key] = value;
	}
}

export function useConfig<T extends SevenTV.SettingType>(key: string) {
	return toConfigRef<T>(key);
}

export function synchronizeFrankerFaceZ() {
	const keys = Object.keys(nodes);
	for (let i = 0; i < keys.length; i++) {
		const n = nodes[Object.keys(nodes)[i]];
		if (!n.ffz_key) continue;

		ffzSettings.getConfigChanges(n.ffz_key, (v) => {
			raw[n.key] = typeof n.ffz_transform === "function" ? n.ffz_transform(v) : (v as SevenTV.SettingType);
		});
	}
}

export function useSettings() {
	function register(newNodes: SevenTV.SettingNode[]) {
		for (const node of newNodes) {
			nodes[node.key] = node;

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
