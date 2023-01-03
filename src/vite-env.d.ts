/// <reference types="vite/client" />
// eslint-disable-next-line prettier/prettier
import type { DefineComponent } from "vue";

declare module "*.vue" {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const component: DefineComponent<Record<string, never>, Record<string, never>, any>;
	export default component;
}
