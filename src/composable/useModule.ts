import { computed, nextTick, onUnmounted, reactive, ref, toRef, watch } from "vue";
import { log } from "@/common/Logger";
import { useSettings } from "@/composable/useSettings";

const data = reactive({
	modules: {} as Record<string, Module>,
});

export function useModule(id: string, opt: ModuleOptions) {
	data.modules[id] = {
		id,
		name: opt.name,
		enabled: true,
		depends_on: opt.depends_on,
		config: opt.config ?? [],
	};

	const mod = toRef(data.modules, id);
	const ready = computed(() => mod.value.ready);
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

	return { ready, dependenciesMet, markAsReady };
}

interface ModuleOptions {
	name: string;
	depends_on: string[];
	config?: SevenTV.SettingNode<SevenTV.SettingType>[];
}

export interface Module {
	id: string;
	name: string;
	enabled: boolean;
	depends_on: string[];
	config: SevenTV.SettingNode<SevenTV.SettingType>[];

	configurable?: boolean;
	ready?: boolean;
}
