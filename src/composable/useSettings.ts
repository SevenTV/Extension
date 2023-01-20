import { Ref, customRef, reactive } from "vue";
import { useFrankerFaceZ } from "./useFrankerFaceZ";
import { useLiveQuery } from "./useLiveQuery";
import { db } from "@/db/idb";

const raw = reactive({} as Record<string, SevenTV.SettingType>);
const nodes = reactive({} as Record<string, SevenTV.SettingNode<SevenTV.SettingType>>);

const { getConfigChanges: getFFZConfigChanges } = useFrankerFaceZ();

function toConfigRef<T extends SevenTV.SettingType>(key: string): Ref<T> {
	return customRef<T>((track, trigger) => {
		return {
			get() {
				track();
				return raw[key] as T;
			},
			set(newVal) {
				// Only write the setting if it passes the optional predicate
				const predicate = nodes[key].predicate;
				if (predicate && !predicate(newVal)) return;

				raw[key] = newVal;
				trigger();

				// Write changes to the db
				db.settings.put({ key: key, type: typeof newVal, value: newVal }, key);
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

		getFFZConfigChanges(n.ffz_key, (v) => {
			raw[n.key] = v as SevenTV.SettingType;
		});
	}
}

export function useSettings() {
	function getNodes() {
		return nodes;
	}

	function register(newNodes: SevenTV.SettingNode<SevenTV.SettingType>[]) {
		for (const node of newNodes) {
			nodes[node.key] = node;

			if (["string", "boolean", "object", "number", "undefined"].includes(typeof raw[node.key])) {
				raw[node.key] = raw[node.key] ?? node.defaultValue;
			}
		}
	}

	return {
		getNodes,
		register,
	};
}
