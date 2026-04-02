<template />

<script setup lang="ts">
import { onUnmounted, ref, toRaw, watch } from "vue";
import { REACT_TYPEOF_TOKEN } from "@/common/Constant";
import { HookedInstance } from "@/common/ReactHooks";
import { defineFunctionHook, definePropertyHook, unsetPropertyHook } from "@/common/Reflection";
import { useConfig } from "@/composable/useSettings";

const props = defineProps<{
	instance: HookedInstance<Twitch.SidebarCardComponent>;
}>();

const showPreviews = useConfig<boolean>("ui.sidebar_previews");

const tooltipContent = ref<ReactExtended.ReactRuntimeElement>();

definePropertyHook(props.instance.component, "props", {
	value: (v: Twitch.SidebarCardComponent["props"]) => {
		definePropertyHook(v, "tooltipContent", {
			value: (v) => {
				if (typeof v == "object") {
					tooltipContent.value = v;
				}
			},
		});
	},
});

watch(
	tooltipContent,
	(tooltip, old) => {
		if (tooltip === old || !tooltip?.type) return;

		const Target = tooltip.type;

		if (typeof Target === "function" && Target.prototype?.render) {
			defineFunctionHook(
				Target.prototype,
				"render",
				function (original: ((...args: unknown[]) => unknown) | null, ...args: unknown[]) {
					if (!original) return;

					const vnode = original.call(this, ...args);
					return patchTooltip(
						this as ReactExtended.ReactRuntimeElement,
						vnode as ReactExtended.ReactRuntimeElement,
					);
				},
			);

			rerenderCard();
		} else if (typeof Target === "function") {
			const originalComponent = Target as (props: unknown, ...args: unknown[]) => unknown;

			tooltip.type = function (props: unknown, ...args: unknown[]) {
				const vnode = originalComponent(props, ...args);

				return patchTooltip(
					this as ReactExtended.ReactRuntimeElement,
					vnode as ReactExtended.ReactRuntimeElement,
				);
			};

			Object.assign(tooltip.type, originalComponent);
			rerenderCard();
		}
	},
	{ immediate: true },
);

watch(showPreviews, () => rerenderCard());

function rerenderCard() {
	toRaw(props.instance.component).forceUpdate();
}

interface PatchedComponent {
	(props: Record<string, unknown>): ReactExtended.ReactRuntimeElement;
	__7tv_patched?: boolean;
}
// TODO: (ftk789) Fix or note it down for extension rewrite
// This is a kinda scuffed way to handle the fact that Twitch sometimes changes the tooltip component to a new one instead of just updating the props,
// which breaks our patch. This forces the card to rerender, which should make it patch the new tooltip component.
// The old one is left unpatched, but it shouldn't cause any issues since it won't be used anymore.

function patchTooltip(
	tooltip: ReactExtended.ReactRuntimeElement,
	vnode: ReactExtended.ReactRuntimeElement,
): ReactExtended.ReactRuntimeElement {
	if (!showPreviews.value || !vnode) return vnode;

	const OriginalType = vnode.type;

	if (typeof OriginalType === "function" && (OriginalType as PatchedComponent).__7tv_patched) {
		return vnode;
	}

	const WrappedComponent: PatchedComponent = (props: Record<string, unknown>): ReactExtended.ReactRuntimeElement => {
		const channelName =
			typeof props.channelDisplayName === "string" ? props.channelDisplayName.toLowerCase() : "???";

		const imageUrl = getThumbnail(channelName);

		const previewElement = {
			[REACT_TYPEOF_TOKEN]: Symbol.for("react.element"),
			type: "div",
			key: "7tv-preview",
			ref: null,
			props: {
				className: "seventv-sidebar-tooltip-preview",
				style: {
					backgroundImage: `${imageUrl}`,
					width: "100%",
					height: "110px",
					backgroundSize: "cover",
					backgroundPosition: "center",
					borderRadius: "4px",
					marginBottom: "8px",
				},
			},
		};

		const originalElement = {
			[REACT_TYPEOF_TOKEN]: Symbol.for("react.element"),
			type: OriginalType,
			key: "twitch-original-content",
			ref: null,
			props,
		};

		return {
			[REACT_TYPEOF_TOKEN]: Symbol.for("react.element"),
			type: "div",
			key: "7tv-tooltip-wrapper",
			ref: null,
			props: {
				children: [previewElement, originalElement],
			},
		} as unknown as ReactExtended.ReactRuntimeElement;
	};

	WrappedComponent.__7tv_patched = true;
	vnode.type = WrappedComponent as unknown as ReactExtended.ReactRuntimeElement["type"];

	return vnode;
}

function getThumbnail(channel: string) {
	let url = `https://static-cdn.jtvnw.net/previews-ttv/live_user_${channel}-190x107.jpg`;

	url += `?${Math.floor(Date.now() / 300000)}`;

	return `url("${url}")`;
}

onUnmounted(() => {
	unsetPropertyHook(props.instance.component, "props");

	if (props.instance.component?.props) {
		unsetPropertyHook(props.instance.component.props, "tooltipContent");
	}

	if (typeof tooltipContent.value?.type == "function") {
		unsetPropertyHook(tooltipContent.value.type.prototype, "type");
	}
});
</script>

<style lang="scss">
.seventv-sidebar-tooltip-preview {
	margin: 2px 0;
	border-radius: 4px;
	width: 100%;
	padding-bottom: 56.25%;
	background-color: var(--color-background-placeholder);
	background-size: contain;
	background-position: center;
}
</style>
