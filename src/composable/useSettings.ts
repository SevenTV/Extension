import { db } from "@/db/IndexedDB";
import { reactive, Ref, customRef } from "vue";
import { useLiveQuery } from "./useLiveQuery";

const raw = reactive({} as Record<string, SevenTV.SettingType>);
const nodes = reactive({} as Record<string, SevenTV.SettingNode<SevenTV.SettingType>>);

function toSettingRef<T extends SevenTV.SettingType>(key: string): Ref<T> {
	return customRef<T>((track, trigger) => {
		return {
			get() {
				track();
				return raw[key] as T;
			},
			set(newVal) {
				//Only write the setting if it passes the optional predicate
				const predicate = nodes[key].predicate;
				if (predicate && !predicate(newVal)) return;

				raw[key] = newVal;
				trigger();

				//Write changes to the db
				db.settings.put({ key: key, type: typeof newVal, value: newVal }, key);
			},
		};
	});
}

db.ready().then(() =>
	useLiveQuery(
		() => db.settings.toArray(),
		(s) => {
			for (const { key, value } of s) {
				raw[key] = value;
			}
		},
	),
);

export function useConfig<T extends SevenTV.SettingType>(key: string) {
	return toSettingRef<T>(key);
}
export function useSettings() {
	function getNodes() {
		return nodes;
	}

	function register(newNodes: SevenTV.SettingNode<SevenTV.SettingType>[]) {
		for (const node of newNodes) {
			nodes[node.key] = node;
			if (!raw[node.key]) raw[node.key] = node.defaultValue;
		}
	}

	return {
		getNodes,
		register,
	};
}
