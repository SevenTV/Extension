import { log } from "@/common/Logger";
import { computed, nextTick, onUnmounted, reactive, ref, watch } from "vue";

const data = reactive({
	modules: {} as Record<string, Module>,
});

export function useModule(id: string, opt: ModuleOptions) {
	data.modules[id] = {
		id,
		name: opt.name,
		enabled: true,
		depends_on: opt.depends_on,
	};

	const mod = ref(data.modules[id]);
	const ready = computed(() => mod.value.ready);
	const dependenciesMet = ref(false);

	const depends = mod.value.depends_on;
	const promises = [] as Promise<Module>[];

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
}

export interface Module {
	id: string;
	name: string;
	enabled: boolean;
	depends_on: string[];

	configurable?: boolean;
	ready?: boolean;
}
