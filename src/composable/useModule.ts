import { Ref, nextTick, onUnmounted, reactive, ref, toRef, watch } from "vue";
import { log } from "@/common/Logger";
import { KickModuleComponentMap, KickModuleID } from "@/types/kick.module";
import type { TwModuleComponentMap, TwModuleID } from "@/types/tw.module";
import { YtModuleComponentMap, YtModuleID } from "@/types/yt.module";

const data = reactive({
	modules: {} as Record<string, Module<never, never>>,
});

export type PlatformModuleID<P extends Platform> = P extends "KICK"
	? KickModuleID
	: P extends "TWITCH"
	? TwModuleID
	: P extends "YOUTUBE"
	? YtModuleID
	: string;

export type PlatformModuleComponentMap<P extends Platform> = P extends "KICK"
	? KickModuleComponentMap
	: P extends "TWITCH"
	? TwModuleComponentMap
	: P extends "YOUTUBE"
	? YtModuleComponentMap
	: // eslint-disable-next-line @typescript-eslint/no-explicit-any
	  any;

export type AnyModuleID =
	| PlatformModuleID<"UNKNOWN">
	| PlatformModuleID<"KICK">
	| PlatformModuleID<"TWITCH">
	| PlatformModuleID<"YOUTUBE">;

export function getModule<P extends Platform, T extends PlatformModuleID<P>>(id: T): Module<P, T> | null {
	return (data.modules[id] ?? null) as Module<P, T> | null;
}

export function getModuleRef<P extends Platform, T extends PlatformModuleID<P>>(id: T): Ref<Module<P, T> | null> {
	const mod = ref<Module<P, T> | null>(null);

	if (data.modules[id]) {
		mod.value = data.modules[id] as Module<never, never>;
	}

	if (!mod.value) {
		const stop = watch(data.modules, (modules) => {
			mod.value = modules[id] as Module<never, never> | null;
			if (mod.value) stop();
		});
	}

	return mod as Ref<Module<P, T> | null>;
}

export function declareModule<P extends Platform, Id extends PlatformModuleID<P> = PlatformModuleID<P>>(
	id: Id,
	opt: ModuleOptions,
) {
	data.modules[id] = reactive<Module<never, never>>({
		id: id as never,
		name: opt.name,
		enabled: true,
		depends_on: opt.depends_on as never[],
		instance: null,
	});

	const mod = toRef(data.modules, id);
	const ready = toRef(mod.value, "ready");
	const dependenciesMet = ref(false);

	const depends = mod.value.depends_on;
	const promises = [] as Promise<Module<P, never>>[];

	// Await dependencies
	for (const depId of depends) {
		const dep = data.modules[depId];
		if (!dep) continue;

		promises.push(
			new Promise<Module<P, never>>((resolve) => {
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

	return {
		ready,
		dependenciesMet,
		markAsReady,
	};
}

interface ModuleOptions {
	name: string;
	depends_on: PlatformModuleID<"UNKNOWN">[];
}

export interface Module<P extends Platform, T extends PlatformModuleID<P>> {
	id: T;
	name: string;
	enabled: boolean;
	depends_on: PlatformModuleID<P>[];

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	instance: InstanceType<PlatformModuleComponentMap<P>[T]> | null;
	configurable?: boolean;
	ready?: boolean;
}
