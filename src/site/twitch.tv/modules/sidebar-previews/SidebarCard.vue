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
		if (tooltip != old) {
			if (old && typeof old.type == "function") unsetPropertyHook(old.type.prototype, "render");

			if (tooltip && typeof tooltip.type == "function") {
				defineFunctionHook(tooltip.type.prototype, "render", function (old, ...args: unknown[]) {
					const vnode = old?.apply(this, args) ?? null;

					return patchTooltip(this, vnode);
				});

				rerenderCard();
			}
		}
	},
	{ immediate: true },
);

watch(showPreviews, () => rerenderCard());

function rerenderCard() {
	toRaw(props.instance.component).forceUpdate();
}

function patchTooltip(tooltip: ReactExtended.ReactRuntimeElement, vnode: ReactExtended.ReactRuntimeElement) {
	if (!showPreviews.value) return vnode;

	const body = vnode?.props?.children;

	if (!body || !body.props?.children) return vnode;

	body.props.style = { width: "20rem" };

	body.props.children.splice(2, 0, {
		[REACT_TYPEOF_TOKEN]: Symbol.for("react.element"),
		ref: null,
		key: null,
		type: "div",
		props: {
			className: "seventv-sidebar-tooltip-preview",
			style: {
				backgroundImage: `url(${tooltip.props.streamPreviewImage})`,
			},
		},
	});

	return vnode;
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
