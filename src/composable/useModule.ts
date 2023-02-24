import { Ref, nextTick, onUnmounted, reactive, ref, toRef, watch } from "vue";
import { log } from "@/common/Logger";
import { useSettings } from "@/composable/useSettings";
import type { TwModuleComponentMap, TwModuleID } from "@/types/tw.module";

const data = reactive({
	modules: {} as Record<TwModuleID, Module>,
});

export function getModule<T extends TwModuleID>(id: T): Module<T> | null {
	return (data.modules[id] ?? null) as Module<T> | null;
}

export function getModuleRef<T extends TwModuleID>(id: T): Ref<Module<T>> {
	const mod = ref<Module | null>(null);

	if (data.modules[id]) {
		mod.value = data.modules[id] as Module<T>;
	}

	if (!mod.value) {
		const stop = watch(data.modules, (modules) => {
			mod.value = modules[id] as Module<T> | null;
			if (mod.value) stop();
		});
	}

	return mod as Ref<Module<T>>;
}

export function declareModule(id: TwModuleID, opt: ModuleOptions) {
	data.modules[id] = {
		id,
		name: opt.name,
		enabled: true,
		depends_on: opt.depends_on,
		config: opt.config ?? [],
		instance: null,
	};

	const mod = toRef(data.modules, id);
	const ready = toRef(mod.value, "ready");
	const dependenciesMet = ref(false);

	const depends = mod.value.depends_on;
	const promises = [] as Promise<Module>[];

	// Await dependencies
	for (const depId of depends) {
		const dep = data.modules[depId];
		if (!dep) continue;

		promises.push(
			new Promise<Module>((resolve) => {
				const ok = watch(dep, () => {
					if (!dep.ready) return;

					ok();
					resolve(dep);
				});
			}),
		);
	}

	// Register config
	if (mod.value.config.length) {
		const { register } = useSettings();

		register(mod.value.config);
	}

	if (promises.length > 0) {
		log.debug(`<Module/${opt.name}>`, "Waiting for modules:", depends.join(", "));
		Promise.all(promises).then(() => {
			dependenciesMet.value = true;

			log.debug(`<Module/${opt.name}>`, `All dependencies met (${promises.length})`);
		});
	} else {
		dependenciesMet.value = true;
	}

	function markAsReady() {
		const done = watch(
			dependenciesMet,
			(ok) => {
				if (!ok) return;

				nextTick(() => done());
				mod.value.ready = true;

				log.debug(`<Module/${opt.name}>`, "Ready");
			},
			{ immediate: true },
		);
	}

	onUnmounted(() => (data.modules[id].ready = false));

	return {
		ready,
		dependenciesMet,
		markAsReady,
	};
}

interface ModuleOptions {
	name: string;
	depends_on: TwModuleID[];
	config?: SevenTV.SettingNode[];
}

export interface Module<T extends keyof TwModuleComponentMap = keyof TwModuleComponentMap> {
	id: T;
	name: string;
	enabled: boolean;
	depends_on: TwModuleID[];
	config: SevenTV.SettingNode<SevenTV.SettingType>[];

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	instance: InstanceType<TwModuleComponentMap[T]> | null;
	configurable?: boolean;
	ready?: boolean;
}
