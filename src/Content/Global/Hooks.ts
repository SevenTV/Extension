import { from, Subject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Child } from 'src/Content/Global/Decorators';

const emitter = new Subject<HookType>();

/** Emit a hook */
export function emitHook(hookName: HookType): void {
	emitter.next(hookName);
}

export type HookType = 'onInit'
	| 'onAppLoaded'
	| 'onInjected'
	| 'onUnload'
	| 'onEmoteSetAdd'
	| 'onEmoteSetRemove'
	| 'onChannelSwitch';

export const HookStore = new Set<Child.WithAllHooks>();

emitter.asObservable().pipe(
	switchMap(hookName => from(HookStore).pipe(
		map(p => p[hookName]?.())
	))
).subscribe();
